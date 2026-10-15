'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Servidor local (somente 127.0.0.1). Interface interativa + API usada pela interface e pela CLI.
// Proteções: escuta só na máquina local, confere Host/Origin (anti DNS-rebinding) e exige o
// token de sessão gerado a cada inicialização em toda chamada de API (anti-CSRF).

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./lib/config');
const store = require('./lib/store');
const secrets = require('./lib/secrets');
const log = require('./lib/logger');
const { OBJETIVOS, missingFor, formQuestions } = require('./lib/questions');
const { review } = require('./lib/compliance');
const gen = require('./lib/generators');
const { MetaClient, MetaError, buildAuthUrl, exchangeCode } = require('./lib/meta');
const flow = require('./lib/campaign-flow');
const reports = require('./lib/reports');
const { coordsFromLink } = require('./lib/geo');
const onboarding = require('./lib/onboarding');

const PUBLIC = path.join(__dirname, 'public');
const MAX_BODY = 12 * 1024 * 1024;

function createApp({ fetchImpl = globalThis.fetch, port = config.PORT } = {}) {
  const sessionToken = crypto.randomBytes(24).toString('hex');
  const oauthStates = new Map(); // state -> { clinicaId, criadoEm }

  function appConfigFile() { return path.join(store.dataDir(), 'app-meta.json'); }
  function getAppConfig() { return store.readJson(appConfigFile(), {}) || {}; }

  function metaClient(clinicaId) {
    const token = process.env.META_ACCESS_TOKEN || secrets.getSecret(clinicaId, 'meta_token');
    if (!token) return null;
    let appSecret = null;
    try { appSecret = secrets.getSecret('app', 'meta_app_secret'); } catch (_) { appSecret = null; }
    return new MetaClient({ token, appSecret, fetchImpl });
  }

  function requireMeta(clinicaId) {
    const c = metaClient(clinicaId);
    if (!c) { const e = new Error('A Meta ainda não está conectada para esta clínica. Abra "Configurar Meta".'); e.status = 409; throw e; }
    return c;
  }

  function send(res, status, body, headers = {}) {
    const isStr = typeof body === 'string' || Buffer.isBuffer(body);
    res.writeHead(status, { 'Content-Type': isStr ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...headers });
    res.end(isStr ? body : JSON.stringify(body));
  }

  function readBody(req) {
    return new Promise((resolve, reject) => {
      let size = 0; const chunks = [];
      req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('Arquivo grande demais (máx. 12 MB).'), { status: 413 })); req.destroy(); } else chunks.push(c); });
      req.on('end', () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(Object.assign(new Error('Dados inválidos.'), { status: 400 })); } });
      req.on('error', reject);
    });
  }

  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  function hostOk(req) {
    if (!allowedHosts.has(req.headers.host)) return false;
    const o = req.headers.origin;
    if (o && !allowedHosts.has(o.replace(/^https?:\/\//, ''))) return false;
    return true;
  }

  // ---------- Rotas ----------
  const routes = [];
  const route = (method, pattern, handler) => routes.push({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler });

  route('GET', '/api/estado', async () => ({
    versao: config.METHOD_VERSION,
    copyright: config.COPYRIGHT,
    clinicas: store.listClinicas(),
    objetivos: Object.fromEntries(Object.entries(OBJETIVOS).map(([k, v]) => [k, { titulo: v.titulo, pilares: v.pilares }])),
    metaApp: { configurado: !!getAppConfig().appId && secrets.secretInfo('app', 'meta_app_secret').existe, appId: getAppConfig().appId || null },
    cofre: secrets.backend(),
    apiVersion: config.META_API_VERSION,
  }));

  route('POST', '/api/clinicas', async ({ body }) => store.createClinica(body.nome));

  route('GET', '/api/clinicas/:id', async ({ p }) => {
    const c = store.requireClinica(p.id);
    const info = secrets.secretInfo(p.id, 'meta_token');
    return { clinica: c, retomada: store.retomada(p.id), meta: { conectada: info.existe || !!process.env.META_ACCESS_TOKEN, conectadaEm: info.salvoEm || null, expiraEm: info.info ? info.info.expiraEm : null, ativos: c.meta } };
  });

  route('GET', '/api/perguntas/:form', async ({ p }) => formQuestions(p.form));

  route('GET', '/api/clinicas/:id/proximas/:objetivo', async ({ p }) => {
    const c = store.requireClinica(p.id);
    const faltam = missingFor(p.objetivo, c.respostas).map((q) => {
      if (q.tipo === 'opcao_dinamica') {
        const [f, k] = q.fonte.split('.');
        return { ...q, tipo: 'opcao', opcoes: (c.respostas[f] && c.respostas[f][k]) || [] };
      }
      if (q.padrao) { const [f, k] = q.padrao.split('.'); return { ...q, valorSugerido: c.respostas[f] && c.respostas[f][k] }; }
      return q;
    });
    const total = OBJETIVOS[p.objetivo].precisa.length;
    return { objetivo: p.objetivo, titulo: OBJETIVOS[p.objetivo].titulo, protocolo: OBJETIVOS[p.objetivo].protocolo, faltam, total, respondidas: total - faltam.length };
  });

  route('POST', '/api/clinicas/:id/respostas', async ({ p, body }) => {
    const r = store.saveAnswers(p.id, body.form, body.respostas);
    // Ao salvar o link do mapa, tenta extrair as coordenadas (inclusive de link curto).
    if (r.ok && body.form === 'clinica' && body.respostas && body.respostas.mapa_link) {
      try {
        const coords = await coordsFromLink(body.respostas.mapa_link, fetchImpl);
        r.coordenadas = coords;
        if (coords) {
          const c = store.requireClinica(p.id);
          c.respostas.clinica.mapa_coords = `${coords.latitude},${coords.longitude}`;
          store.writeJsonAtomic(path.join(store.dataDir(), 'clinicas', p.id, 'clinica.json'), c);
          store.audit(p.id, 'coordenadas_extraidas', { fonte: coords.fonte });
        } else r.avisoMapa = 'Não encontramos as coordenadas nesse link. Abra o lugar no Google Maps pelo computador e copie o link da barra de endereço.';
      } catch (e) { r.avisoMapa = 'Não foi possível ler o link do mapa agora. Tente colar o link completo.'; }
    }
    return r;
  });

  route('POST', '/api/clinicas/:id/metas', async ({ p, body }) => store.updateMetas(p.id, body));
  route('POST', '/api/clinicas/:id/tarefa', async ({ p, body }) => store.setTarefa(p.id, body && body.objetivo ? body : null));
  route('POST', '/api/clinicas/:id/sessao', async ({ p, body }) => store.saveSessao(p.id, body));
  route('GET', '/api/clinicas/:id/sessoes', async ({ p }) => store.listEntities('sessoes', p.id));
  route('GET', '/api/clinicas/:id/historico', async ({ p }) => store.readAudit(p.id, { limite: 300 }).reverse());

  route('POST', '/api/compliance', async ({ body }) => review(body));

  // ---------- Criativos e textos ----------
  route('GET', '/api/clinicas/:id/copies/:objetivo', async ({ p }) => gen.copies(store.requireClinica(p.id), p.objetivo));
  route('GET', '/api/clinicas/:id/criativo/estatico', async ({ p, q }) => gen.promptEstatico(store.requireClinica(p.id), { angulo: q.get('angulo') || undefined }));
  route('GET', '/api/clinicas/:id/criativo/video', async ({ p, q }) => gen.roteiroVideo(store.requireClinica(p.id), { gancho: q.get('gancho') || undefined }));
  route('POST', '/api/clinicas/:id/criativo/analise', async ({ body }) => gen.analiseEstatico(body.respostas));
  route('GET', '/api/clinicas/:id/criativos', async ({ p }) => store.listEntities('criativos', p.id).map(({ arquivo, ...x }) => ({ ...x, temArquivo: !!arquivo })));
  route('POST', '/api/clinicas/:id/criativos', async ({ p, body }) => {
    store.requireClinica(p.id);
    const rec = { titulo: String(body.titulo || 'Criativo').slice(0, 120), formato: body.formato || 'Imagem', origem: body.origem || 'arquivo', copy: body.copy || null, instagramMediaId: body.instagramMediaId || null, referencia: body.referencia || null, decisao: null, status: 'rascunho' };
    if (body.imagemBase64) {
      const m = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(body.imagemBase64);
      if (!m) { const e = new Error('Envie uma imagem JPG ou PNG.'); e.status = 400; throw e; }
      const buf = Buffer.from(m[2], 'base64');
      if (buf.length > 8 * 1024 * 1024) { const e = new Error('Imagem maior que 8 MB.'); e.status = 413; throw e; }
      const dir = path.join(store.dataDir(), 'criativos', p.id, 'arquivos');
      fs.mkdirSync(dir, { recursive: true });
      const nome = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${m[1] === 'png' ? 'png' : 'jpg'}`;
      fs.writeFileSync(path.join(dir, nome), buf, { mode: 0o600 });
      if (fs.statSync(path.join(dir, nome)).size !== buf.length) throw new Error('A imagem não foi gravada corretamente.');
      rec.arquivo = nome; rec.nomeArquivo = body.nomeArquivo || nome;
    }
    if (rec.copy) rec.conformidade = review({ textos: [rec.copy.textoPrincipal, rec.copy.titulo] });
    return store.createEntity('criativos', p.id, rec, 'criativo_registrado');
  });
  route('POST', '/api/clinicas/:id/criativos/:cid/decisao', async ({ p, body }) => store.updateEntity('criativos', p.id, p.cid, { decisao: body.decisao, status: body.decisao }, 'decisao_criativo', { decisao: body.decisao, justificativa: body.justificativa || null }));

  route('GET', '/api/clinicas/:id/scripts', async ({ p }) => gen.scriptsWhatsapp(store.requireClinica(p.id)));
  route('GET', '/api/clinicas/:id/objecoes', async ({ p }) => gen.respostasObjecoes(store.requireClinica(p.id)));
  route('GET', '/api/clinicas/:id/treinamento', async ({ p }) => gen.treinamento(store.requireClinica(p.id)));
  route('POST', '/api/clinicas/:id/treinamento/avaliacao', async ({ p, body }) => {
    const r = gen.avaliarSimulacao(body.notas || {});
    store.createEntity('sessoes', p.id, { solicitacao: 'Avaliação de simulação de atendimento', objetivo: 'treinar', informacoesColetadas: { pessoa: body.pessoa || 'equipe', simulacao: body.simulacao || null }, resultadosConfirmados: r, proximoPasso: r.planoMelhoria.length ? `Treinar: ${r.planoMelhoria[0]}` : 'Repetir simulação em 15 dias' }, 'avaliacao_treinamento');
    return r;
  });
  route('POST', '/api/clinicas/:id/metodo', async ({ p, body }) => {
    const c = store.requireClinica(p.id);
    const nomes = gen.nomesMetodo(c, body || {});
    const rec = store.createEntity('criativos', p.id, { titulo: `Nomes de método — ${body.procedimento || ''}`.trim(), formato: 'nomes_metodo', origem: 'gerador', nomes, status: 'rascunho' }, 'nomes_metodo_gerados');
    return { id: rec.id, nomes };
  });

  // ---------- CRM ----------
  route('GET', '/api/clinicas/:id/crm', async ({ p }) => {
    const d = store.readCrm(p.id);
    const { funilCrm } = require('./lib/metrics');
    return { contatos: d.contatos, funil: funilCrm(d.contatos), etapas: store.ETAPAS, alternativas: store.ETAPAS_ALTERNATIVAS, rotulos: store.ETAPA_LABEL };
  });
  route('POST', '/api/clinicas/:id/crm', async ({ p, body }) => store.addContato(p.id, body));
  route('PATCH', '/api/clinicas/:id/crm/:cid', async ({ p, body }) => store.updateContato(p.id, p.cid, body));
  route('DELETE', '/api/clinicas/:id/crm/:cid', async ({ p, body }) => {
    if (!body || body.confirmacao !== true) { const e = new Error('Confirme a exclusão do contato.'); e.status = 400; throw e; }
    return store.deleteContato(p.id, p.cid, body.motivo);
  });

  // ---------- Meta: app, conexão e ativos ----------
  route('POST', '/api/meta/app', async ({ body }) => {
    if (!/^\d{5,20}$/.test(String(body.appId || ''))) { const e = new Error('ID do app inválido.'); e.status = 400; throw e; }
    if (!body.appSecret || String(body.appSecret).length < 16) { const e = new Error('Chave secreta do app inválida.'); e.status = 400; throw e; }
    secrets.saveSecret('app', 'meta_app_secret', String(body.appSecret), {});
    store.writeJsonAtomic(appConfigFile(), { appId: String(body.appId), salvoEm: new Date().toISOString() });
    log.info('App da Meta configurado', { appId: body.appId });
    return { ok: true, appId: String(body.appId) };
  });

  route('GET', '/api/clinicas/:id/meta/conectar', async ({ p }) => {
    store.requireClinica(p.id);
    const app = getAppConfig();
    if (!app.appId) { const e = new Error('Configure primeiro o app da Meta (ID e chave secreta).'); e.status = 409; throw e; }
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.set(state, { clinicaId: p.id, criadoEm: Date.now() });
    return { url: buildAuthUrl({ appId: app.appId, redirectUri: `http://localhost:${port}/auth/meta/callback`, state }) };
  });

  route('POST', '/api/clinicas/:id/meta/token', async ({ p, body }) => {
    store.requireClinica(p.id);
    const token = String(body.token || '').trim();
    if (token.length < 30) { const e = new Error('Token inválido.'); e.status = 400; throw e; }
    const client = new MetaClient({ token, fetchImpl });
    const me = await client.me();
    const r = secrets.saveSecret(p.id, 'meta_token', token, { tipo: body.tipo || 'manual', usuario: me.name || null, expiraEm: body.expiraEm || null });
    store.audit(p.id, 'meta_conectada', { metodo: 'campo_seguro', usuario: me.name || null });
    return { ok: true, usuario: me.name, salvoEm: r.salvoEm };
  });

  route('DELETE', '/api/clinicas/:id/meta', async ({ p }) => {
    secrets.deleteSecret(p.id, 'meta_token');
    store.audit(p.id, 'meta_desconectada', {});
    return { ok: true, aviso: 'Acesso removido deste computador. Para revogar também na Meta: Facebook > Configurações > Segurança > Integrações comerciais > remover o app.' };
  });

  route('GET', '/api/clinicas/:id/meta/status', async ({ p }) => {
    const client = requireMeta(p.id);
    const me = await client.me();
    const perms = await client.permissions();
    return { usuario: me.name, permissoes: perms };
  });

  route('GET', '/api/clinicas/:id/meta/ativos', async ({ p }) => {
    const client = requireMeta(p.id);
    const [contas, paginas] = await Promise.all([client.adAccounts(), client.pages()]);
    return { contas, paginas: paginas.map((x) => ({ id: x.id, name: x.name, instagram: x.instagram_business_account || null })) };
  });

  route('POST', '/api/clinicas/:id/meta/selecionar', async ({ p, body }) => {
    const client = requireMeta(p.id);
    const act = String(body.adAccountId || '');
    if (!/^act_\d+$/.test(act)) { const e = new Error('Conta de anúncios inválida.'); e.status = 400; throw e; }
    const acc = await client.account(act);
    const pages = await client.pages();
    const page = pages.find((x) => x.id === String(body.pageId));
    if (!page) { const e = new Error('Página não encontrada entre as que você administra.'); e.status = 400; throw e; }
    return store.updateClinicaMeta(p.id, {
      adAccountId: act, accountName: acc.name, timezone: acc.timezone_name, currency: acc.currency,
      pageId: page.id, instagramUserId: page.instagram_business_account ? page.instagram_business_account.id : null, conectadoEm: new Date().toISOString(),
    });
  });

  // Ponto de partida: antes de conectar (respostas da gestora) e depois (verificação real pela API).
  route('GET', '/api/clinicas/:id/meta/guia', async ({ p }) => onboarding.guia(store.requireClinica(p.id).respostas.meta || {}));
  route('GET', '/api/clinicas/:id/meta/diagnostico', async ({ p }) => {
    const c = store.requireClinica(p.id);
    const d = await onboarding.diagnosticar(requireMeta(p.id), { selecionado: c.meta });
    store.audit(p.id, 'meta_diagnostico', { pronto: d.pronto, itens: d.itens.map((i) => `${i.id}:${i.status}`) });
    return d;
  });

  route('GET', '/api/clinicas/:id/meta/cidades', async ({ p, q }) => requireMeta(p.id).searchCity(q.get('q') || ''));

  // ---------- Campanhas ----------
  function loadCriativo(clinicaId, criativoId) {
    if (!criativoId) return null;
    const cr = store.getEntity('criativos', clinicaId, criativoId);
    if (!cr) { const e = new Error('Criativo não encontrado.'); e.status = 404; throw e; }
    const out = { id: cr.id, instagramMediaId: cr.instagramMediaId || null, nomeArquivo: cr.nomeArquivo || null };
    if (cr.arquivo) out.imagemBase64 = fs.readFileSync(path.join(store.dataDir(), 'criativos', clinicaId, 'arquivos', cr.arquivo)).toString('base64');
    return out;
  }

  route('POST', '/api/clinicas/:id/campanhas/rascunho', async ({ p, body }) => {
    const c = store.requireClinica(p.id);
    const criativo = loadCriativo(p.id, body.criativoId);
    const plan = flow.buildPlan({ clinica: c, objetivo: body.objetivo, copy: body.copy, criativo });
    const rec = store.createEntity('campanhas', p.id, { nome: plan.nome, objetivo: body.objetivo, estado: 'rascunho', copy: body.copy, criativoId: body.criativoId || null, resumo: plan.resumo, pendencias: plan.pendencias, conformidade: plan.conformidade }, 'rascunho_criado');
    store.setTarefa(p.id, { objetivo: body.objetivo, etapa: 'aprovacao', titulo: `Aprovar e publicar: ${plan.nome}`, campanhaId: rec.id });
    return { campanha: rec, plano: { resumo: plan.resumo, pendencias: plan.pendencias, conformidade: plan.conformidade, podePublicar: plan.podePublicar, observacao: plan.observacao, specs: plan.specs } };
  });

  route('GET', '/api/clinicas/:id/campanhas', async ({ p }) => store.listEntities('campanhas', p.id));
  route('GET', '/api/clinicas/:id/campanhas/:cid', async ({ p }) => store.getEntity('campanhas', p.id, p.cid));

  route('POST', '/api/clinicas/:id/campanhas/:cid/publicar', async ({ p, body }) => {
    if (body.confirmacao !== true || String(body.frase || '').trim().toUpperCase() !== 'PUBLICAR') { const e = new Error('Para publicar, marque a confirmação e digite PUBLICAR.'); e.status = 400; throw e; }
    const c = store.requireClinica(p.id);
    const cp = store.getEntity('campanhas', p.id, p.cid);
    if (!cp) { const e = new Error('Campanha não encontrada.'); e.status = 404; throw e; }
    if (cp.estado !== 'rascunho' && cp.estado !== 'erro_publicacao') { const e = new Error(`Esta campanha já está no estado "${cp.estado}". Não será duplicada.`); e.status = 409; throw e; }
    const client = requireMeta(p.id);
    const criativo = loadCriativo(p.id, cp.criativoId);
    const plan = flow.buildPlan({ clinica: c, objetivo: cp.objetivo, copy: cp.copy, criativo });
    store.updateEntity('campanhas', p.id, p.cid, { estado: 'publicando' }, 'publicacao_iniciada', { confirmadoPor: 'gestora', resumo: plan.resumo });
    try {
      const r = await flow.publish({
        client, plan, clinica: c, confirmacao: true, criativo,
        onStep: (s) => store.updateEntity('campanhas', p.id, p.cid, { metaIds: s.ids }, `etapa_${s.passo}`, { ok: s.ok, erro: s.erro || null }),
      });
      const upd = store.updateEntity('campanhas', p.id, p.cid, { estado: r.estado, metaIds: r.ids, effectiveStatus: r.effectiveStatus, issues: r.issues, inicio: plan.inicio, inicioUnix: plan.inicio && plan.inicio.unix, proximoMonitoramento: r.proximoMonitoramento }, 'publicada', { estado: r.estado, ids: r.ids });
      store.setTarefa(p.id, { objetivo: 'monitorar', etapa: 'aguardando_monitoramento', titulo: `Monitorar ${plan.nome}`, campanhaId: p.cid, quando: r.proximoMonitoramento });
      return { ok: true, estado: r.estado, ids: r.ids, effectiveStatus: r.effectiveStatus, passos: r.passos, proximoMonitoramento: r.proximoMonitoramento, campanha: upd };
    } catch (e) {
      store.updateEntity('campanhas', p.id, p.cid, { estado: 'erro_publicacao', metaIds: e.ids || null, ultimoErro: e.message }, 'erro_publicacao', { erro: e.message, passos: e.passos || null });
      log.error('Falha na publicação', { clinica: p.id, campanha: p.cid, erro: e.message });
      return { ok: false, estado: 'erro_publicacao', erro: e.message, passos: e.passos || [], ids: e.ids || {}, aviso: e.ids && e.ids.campaignId ? 'A campanha foi criada PAUSADA na Meta e não está gastando. Corrija o problema e tente de novo, ou exclua-a no Gerenciador.' : 'Nada foi criado na Meta.' };
    }
  });

  route('POST', '/api/clinicas/:id/campanhas/:cid/status', async ({ p, body }) => {
    const cp = store.getEntity('campanhas', p.id, p.cid);
    if (!cp || !cp.metaIds || !cp.metaIds.campaignId) { const e = new Error('Campanha sem identificador na Meta.'); e.status = 409; throw e; }
    if (body.confirmacao !== true) { const e = new Error('Confirme a alteração.'); e.status = 400; throw e; }
    const client = requireMeta(p.id);
    if (body.acao === 'pausar' || body.acao === 'ativar') {
      await client.setStatus(cp.metaIds.campaignId, body.acao === 'pausar' ? 'PAUSED' : 'ACTIVE');
    }
    const st = await client.status(cp.metaIds.adId || cp.metaIds.campaignId);
    const estado = flow.mapEstado(st.effective_status, cp.inicioUnix);
    return store.updateEntity('campanhas', p.id, p.cid, { estado, effectiveStatus: st.effective_status, issues: st.issues_info || null }, body.acao ? `campanha_${body.acao === 'pausar' ? 'pausada' : 'ativada'}` : 'status_consultado', { estado, justificativa: body.justificativa || null });
  });

  route('POST', '/api/clinicas/:id/campanhas/:cid/monitorar', async ({ p, body }) => {
    const c = store.requireClinica(p.id);
    const cp = store.getEntity('campanhas', p.id, p.cid);
    if (!cp) { const e = new Error('Campanha não encontrada.'); e.status = 404; throw e; }
    let linhas = []; let fonte = 'sem_meta';
    if (cp.metaIds && cp.metaIds.campaignId) {
      const client = requireMeta(p.id);
      linhas = await client.insights(cp.metaIds.campaignId, { level: 'ad' });
      fonte = 'meta';
    }
    const mon = reports.montarMonitoramento({ clinica: c, campanha: cp, linhas, crmContatos: store.readCrm(p.id).contatos, respostasGestora: body.respostasGestora || {}, cfgClassificacao: body.cfgClassificacao || {} });
    const rec = store.createEntity('monitoramento', p.id, { ...mon, fonte, recomendacao: body.recomendacao || null, aprendizado: body.aprendizado || null }, 'monitoramento_criado');
    const prox = new Date(Date.now() + Number(body.proximoEmDias || 3) * 864e5).toISOString();
    store.updateEntity('campanhas', p.id, p.cid, { proximoMonitoramento: prox, ultimoMonitoramento: rec.id }, 'monitoramento_registrado', { monitoramentoId: rec.id, proximo: prox });
    return { monitoramento: rec, proximoMonitoramento: prox };
  });

  route('POST', '/api/clinicas/:id/campanhas/:cid/decisao', async ({ p, body }) => {
    const validas = ['manter', 'ajustar', 'pausar', 'escalar', 'testar_variacao'];
    if (!validas.includes(body.decisao)) { const e = new Error('Decisão inválida.'); e.status = 400; throw e; }
    if (!body.justificativa) { const e = new Error('Registre a justificativa da decisão.'); e.status = 400; throw e; }
    return store.updateEntity('campanhas', p.id, p.cid, { ultimaDecisao: { decisao: body.decisao, justificativa: body.justificativa, ts: new Date().toISOString() } }, 'decisao_registrada', { decisao: body.decisao, justificativa: body.justificativa });
  });

  route('GET', '/api/clinicas/:id/monitoramento', async ({ p }) => store.listEntities('monitoramento', p.id));

  route('POST', '/api/clinicas/:id/relatorio-semanal', async ({ p }) => {
    const md = reports.semanalMarkdown(p.id);
    const rec = store.createEntity('monitoramento', p.id, { tipo: 'relatorio_semanal', markdown: md }, 'relatorio_semanal_gerado');
    return { id: rec.id, markdown: md };
  });

  // ---------- Servidor ----------
  async function handle(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (!hostOk(req)) return send(res, 403, { erro: 'Acesso permitido somente pelo próprio computador.' });

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8').replace('__SESSION_TOKEN__', sessionToken);
      return send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'" });
    }
    if (req.method === 'GET' && /^\/static\/[\w.-]+$/.test(url.pathname)) {
      const f = path.join(PUBLIC, path.basename(url.pathname));
      if (!fs.existsSync(f)) return send(res, 404, 'não encontrado');
      const type = f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'application/octet-stream';
      return send(res, 200, fs.readFileSync(f), { 'Content-Type': `${type}; charset=utf-8` });
    }
    if (req.method === 'GET' && url.pathname === '/auth/meta/callback') {
      const st = oauthStates.get(url.searchParams.get('state') || '');
      oauthStates.delete(url.searchParams.get('state') || '');
      if (!st || Date.now() - st.criadoEm > 10 * 60 * 1000) return send(res, 400, 'Autorização expirada ou inválida. Volte ao sistema e clique em Conectar novamente.');
      if (url.searchParams.get('error')) return send(res, 400, 'A autorização foi cancelada na Meta. Volte ao sistema para tentar de novo.');
      try {
        const app = getAppConfig();
        const appSecret = secrets.getSecret('app', 'meta_app_secret');
        const r = await exchangeCode({ appId: app.appId, appSecret, redirectUri: `http://localhost:${port}/auth/meta/callback`, code: url.searchParams.get('code'), fetchImpl });
        const expiraEm = r.expiresIn ? new Date(Date.now() + r.expiresIn * 1000).toISOString() : null;
        secrets.saveSecret(st.clinicaId, 'meta_token', r.token, { tipo: r.tipo, expiraEm });
        store.audit(st.clinicaId, 'meta_conectada', { metodo: 'oauth', expiraEm });
        res.writeHead(302, { Location: `/?conectado=1&clinica=${encodeURIComponent(st.clinicaId)}` });
        return res.end();
      } catch (e) {
        log.error('Falha no OAuth', { erro: e.message });
        return send(res, 400, `Não foi possível concluir a conexão: ${e.explicacao || e.message}`);
      }
    }

    if (!url.pathname.startsWith('/api/')) return send(res, 404, { erro: 'Rota não encontrada.' });
    if (req.headers['x-6d-token'] !== sessionToken) return send(res, 401, { erro: 'Sessão inválida. Recarregue a página.' });

    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = r.re.exec(url.pathname);
      if (!m) continue;
      try {
        const body = ['POST', 'PATCH', 'DELETE'].includes(req.method) ? await readBody(req) : {};
        const p = Object.fromEntries(Object.entries(m.groups || {}).map(([k, v]) => [k, decodeURIComponent(v)]));
        const out = await r.handler({ p, q: url.searchParams, body, req });
        return send(res, 200, out);
      } catch (e) {
        // Erro da Meta é sempre "falha externa" (502): o status HTTP da Meta (ex.: 401 de token
        // expirado) não pode ser confundido com a sessão do próprio sistema.
        const status = e instanceof MetaError ? 502 : e.status || (e.name === 'StoreError' || e.name === 'SecretError' ? 400 : 500);
        if (status >= 500) log.error('Erro na API', { rota: url.pathname, erro: e.message });
        return send(res, status, { erro: e instanceof MetaError ? e.explicacao : e.message, codigoMeta: e.code || null });
      }
    }
    return send(res, 404, { erro: 'Rota não encontrada.' });
  }

  const server = http.createServer((req, res) => { handle(req, res).catch((e) => { log.error('Falha inesperada', { erro: e.message }); send(res, 500, { erro: 'Erro inesperado.' }); }); });
  return { server, sessionToken, port, routes: routes.map((r) => ({ method: r.method, re: r.re })) };
}

if (require.main === module) {
  const { server, port } = createApp();
  server.listen(port, config.HOST, () => {
    log.info(`Método Clínica de Estética 6D rodando em http://localhost:${port}`);
    process.stdout.write(`\n  Abra no navegador: http://localhost:${port}\n  (feche esta janela para desligar)\n\n`);
  });
}

module.exports = { createApp };
