'use strict';
// Testes de aceitação via HTTP. Chamadas à Meta usam fetch SIMULADO (SIMULAÇÃO).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { setupEnv, mockFetch, TOKEN_FALSO, clinicaCompleta } = require('./helpers');
setupEnv('server');
const store = require('../app/lib/store');
const secrets = require('../app/lib/secrets');
const { createApp } = require('../app/server');

const PORT = 47000 + Math.floor(Math.random() * 1000);
const metaCalls = [];
const fetchSimulado = mockFetch([
  { match: (m, u) => u.includes('/me?'), reply: () => ({ body: { id: '1', name: 'Gestora Teste' } }) },
  { match: (m, u) => u.includes('/me/permissions'), reply: () => ({ body: { data: [{ permission: 'ads_read', status: 'granted' }] } }) },
  { match: (m, u) => u.includes('/insights'), reply: () => ({ body: { data: [{ ad_id: 'AD1', ad_name: 'Anúncio 1', spend: '90', impressions: '9000', clicks: '120', ctr: '1.33', cpc: '0.75', cpm: '10', reach: '6000', frequency: '1.5', actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '18' }] }] } }) },
], metaCalls);
const { server, sessionToken, routes } = createApp({ fetchImpl: fetchSimulado, port: PORT });

function req(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path: url, headers: { Host: `127.0.0.1:${PORT}`, 'Content-Type': 'application/json', 'X-6D-Token': sessionToken, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}), ...headers } }, (res) => {
      let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => { let j = null; try { j = JSON.parse(t); } catch (_) { j = t; } resolve({ status: res.statusCode, body: j, headers: res.headers }); });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

test.before(() => new Promise((r) => server.listen(PORT, '127.0.0.1', r)));
test.after(() => new Promise((r) => server.close(r)));

test('página inicial injeta token de sessão e envia CSP', async () => {
  const r = await req('GET', '/');
  assert.equal(r.status, 200);
  assert.ok(r.body.includes(sessionToken));
  assert.match(r.headers['content-security-policy'], /script-src 'self'/);
});

test('segurança: sem token 401, Host estranho 403, origem externa 403', async () => {
  assert.equal((await req('GET', '/api/estado', undefined, { 'X-6D-Token': 'errado' })).status, 401);
  assert.equal((await req('GET', '/api/estado', undefined, { Host: 'evil.com' })).status, 403);
  assert.equal((await req('POST', '/api/clinicas', { nome: 'X' }, { Origin: 'https://evil.com' })).status, 403);
});

test('fluxo: cadastro → objetivo → perguntas uma a uma sem repetir', async () => {
  const c = (await req('POST', '/api/clinicas', { nome: 'Clínica HTTP' })).body;
  let p = (await req('GET', `/api/clinicas/${c.id}/proximas/whatsapp`)).body;
  const total = p.faltam.length;
  assert.equal(p.faltam[0].ref, 'clinica.cidade_uf');
  const r = await req('POST', `/api/clinicas/${c.id}/respostas`, { form: 'clinica', respostas: { cidade_uf: 'Campinas/SP' } });
  assert.equal(r.body.ok, true);
  p = (await req('GET', `/api/clinicas/${c.id}/proximas/whatsapp`)).body;
  assert.equal(p.faltam.length, total - 1);
  assert.notEqual(p.faltam[0].ref, 'clinica.cidade_uf');
  const link = await req('POST', `/api/clinicas/${c.id}/respostas`, { form: 'clinica', respostas: { mapa_link: 'https://www.google.com/maps/@-22.9,-47.06,15z' } });
  assert.deepEqual([link.body.coordenadas.latitude, link.body.coordenadas.longitude], [-22.9, -47.06]);
  const bad = await req('POST', `/api/clinicas/${c.id}/respostas`, { form: 'clinica', respostas: { whatsapp: '12' } });
  assert.equal(bad.body.ok, false);
});

test('rascunho de campanha mostra pendências reais; publicar exige confirmação e Meta', async () => {
  const id = clinicaCompleta(store, 'Clínica Rascunho');
  const cr = await req('POST', `/api/clinicas/${id}/criativos`, { titulo: 'Foto', imagemBase64: 'data:image/png;base64,' + Buffer.from('png-simulado').toString('base64') });
  assert.equal(cr.status, 200);
  const d = await req('POST', `/api/clinicas/${id}/campanhas/rascunho`, { objetivo: 'whatsapp', criativoId: cr.body.id, copy: { titulo: 'Avaliação', textoPrincipal: 'Toque em enviar mensagem e fale com a equipe.' } });
  assert.equal(d.status, 200);
  assert.equal(d.body.plano.podePublicar, false);
  assert.ok(d.body.plano.pendencias.some((x) => /Conta de anúncios/.test(x)));
  const cid = d.body.campanha.id;
  assert.equal((await req('POST', `/api/clinicas/${id}/campanhas/${cid}/publicar`, { confirmacao: true, frase: 'ok' })).status, 400, 'sem a frase');
  assert.equal((await req('POST', `/api/clinicas/${id}/campanhas/${cid}/publicar`, { confirmacao: false, frase: 'PUBLICAR' })).status, 400, 'sem a marcação');
  const semMeta = await req('POST', `/api/clinicas/${id}/campanhas/${cid}/publicar`, { confirmacao: true, frase: 'PUBLICAR' });
  assert.equal(semMeta.status, 409);
  assert.match(semMeta.body.erro, /Meta ainda não está conectada/);
  assert.equal(store.getEntity('campanhas', id, cid).estado, 'rascunho', 'nada foi marcado como publicado');
  const ret = (await req('GET', `/api/clinicas/${id}`)).body.retomada;
  assert.match(ret.proximaAcao, /Aprovar e publicar/);
});

test('Meta: token por campo seguro fica cifrado e nunca volta na API', async () => {
  const id = clinicaCompleta(store, 'Clínica Token');
  const r = await req('POST', `/api/clinicas/${id}/meta/token`, { token: TOKEN_FALSO });
  assert.equal(r.status, 200);
  assert.equal(r.body.usuario, 'Gestora Teste');
  const info = await req('GET', `/api/clinicas/${id}`);
  assert.equal(info.body.meta.conectada, true);
  assert.ok(!JSON.stringify(info.body).includes(TOKEN_FALSO));
  const perms = await req('GET', `/api/clinicas/${id}/meta/status`);
  assert.equal(perms.body.permissoes.ok, false, 'detecta permissões faltando');
  // Nenhum arquivo de dados, segredo ou log contém o token em texto puro.
  const walk = (d, out = []) => { if (!fs.existsSync(d)) return out; for (const n of fs.readdirSync(d)) { const p = path.join(d, n); fs.statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
  for (const f of [...walk(process.env.M6D_DATA_DIR), ...walk(process.env.M6D_SECRETS_DIR), ...walk(process.env.M6D_LOG_DIR)]) assert.ok(!fs.readFileSync(f, 'utf8').includes(TOKEN_FALSO), f);
  assert.equal(secrets.getSecret(id, 'meta_token'), TOKEN_FALSO);
  await req('DELETE', `/api/clinicas/${id}/meta`, {});
  assert.equal(secrets.getSecret(id, 'meta_token'), null);
});

test('monitoramento (SIMULAÇÃO Meta + CRM real): métricas com origem, diagnóstico e decisão registrada', async () => {
  const id = clinicaCompleta(store, 'Clínica Monitor HTTP');
  secrets.saveSecret(id, 'meta_token', TOKEN_FALSO);
  const cp = store.createEntity('campanhas', id, { nome: 'Campanha X', objetivo: 'whatsapp', estado: 'ativa', metaIds: { campaignId: 'CAMP9' }, inicioUnix: Math.floor(Date.now() / 1000) - 8 * 86400 });
  for (let i = 0; i < 12; i++) {
    const ct = store.addContato(id, { nome: `C${i}`, campanhaId: cp.id, origem: 'anuncio' });
    if (i < 6) store.updateContato(id, ct.id, { etapa: 'qualificado' });
    if (i < 3) store.updateContato(id, ct.id, { etapa: 'agendado' });
  }
  const r = await req('POST', `/api/clinicas/${id}/campanhas/${cp.id}/monitorar`, { respostasGestora: { custoAlvo: '10' } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const m = r.body.monitoramento;
  assert.deepEqual(m.metricas.investimento, { valor: 90, origem: 'meta' });
  assert.deepEqual(m.metricas.custoPorConversa, { valor: 5, origem: 'calculo' });
  assert.equal(m.funil.agendados.origem, 'clinica');
  assert.equal(m.classificacoes[0].classe, 'candidato_escala');
  assert.ok(r.body.proximoMonitoramento);
  assert.equal((await req('POST', `/api/clinicas/${id}/campanhas/${cp.id}/decisao`, { decisao: 'escalar' })).status, 400, 'decisão sem justificativa é recusada');
  const dec = await req('POST', `/api/clinicas/${id}/campanhas/${cp.id}/decisao`, { decisao: 'escalar', justificativa: 'Custo dentro do alvo e 3 agendamentos' });
  assert.equal(dec.body.ultimaDecisao.decisao, 'escalar');
  const rel = await req('POST', `/api/clinicas/${id}/relatorio-semanal`);
  assert.match(rel.body.markdown, /Campanha X/);
  assert.match(rel.body.markdown, /Completar 7 dias não torna uma campanha vencedora/);
  assert.match(rel.body.markdown, /Todos os direitos reservados/);
});

test('CRM e isolamento via API', async () => {
  const a = clinicaCompleta(store, 'Clínica CRM A');
  const b = clinicaCompleta(store, 'Clínica CRM B');
  const ct = await req('POST', `/api/clinicas/${a}/crm`, { nome: 'Maria', procedimento: 'Limpeza' });
  assert.equal((await req('GET', `/api/clinicas/${b}/crm`)).body.contatos.length, 0);
  assert.equal((await req('PATCH', `/api/clinicas/${b}/crm/${ct.body.id}`, { etapa: 'agendado' })).status, 400, 'outra clínica não altera');
  assert.equal((await req('DELETE', `/api/clinicas/${a}/crm/${ct.body.id}`, {})).status, 400, 'exclusão exige confirmação');
  const del = await req('DELETE', `/api/clinicas/${a}/crm/${ct.body.id}`, { confirmacao: true }); assert.equal(del.status, 200, JSON.stringify(del.body));
});

test('compliance acionado pela API', async () => {
  const r = await req('POST', '/api/compliance', { textos: ['Resultado garantido sem dor'] });
  assert.equal(r.body.status, 'bloqueado');
});

test('cada chamada feita pela interface corresponde a uma rota real do servidor', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'app', 'public', 'app.js'), 'utf8');
  const chamadas = [...js.matchAll(/api\('(GET|POST|PATCH|DELETE)',\s*[`'"]([^`'"]+)[`'"]/g)].map((m) => [m[1], m[2].replace(/\$\{[^}]+\}/g, 'X1').replace(/\?.*$/, '')]);
  assert.ok(chamadas.length >= 30, `poucas chamadas encontradas: ${chamadas.length}`);
  const semRota = chamadas.filter(([m, u]) => !routes.some((r) => r.method === m && r.re.test(u)));
  assert.deepEqual(semRota, [], `botões sem rota: ${JSON.stringify(semRota)}`);
});

test('a interface oferece todas as opções exigidas', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'app', 'public', 'app.js'), 'utf8');
  for (const t of ['Quero clientes no WhatsApp', 'Quero seguidores no Instagram', 'Quero reconhecimento local', 'Quero criar um criativo', 'Quero modelar um anúncio', 'Quero monitorar campanhas', 'Quero otimizar resultados', 'Quero treinar minha equipe', 'Quero consultar o histórico', 'Voltar e editar', 'Continuar de onde parei', 'PUBLICAR']) assert.ok(js.includes(t), t);
});
