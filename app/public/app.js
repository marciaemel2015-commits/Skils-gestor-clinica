// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Interface interativa. Cada botão chama uma rota real do servidor local.
'use strict';

const TOKEN = document.querySelector('meta[name="x6d"]').content;
const $app = document.getElementById('app');
const S = { estado: null, clinicaId: null, clinica: null, retomada: null, meta: null, pilha: [], fluxo: null };

// ---------- utilidades ----------
async function api(method, url, body) {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-6D-Token': TOKEN }, body: body === undefined ? undefined : JSON.stringify(body) });
  let data = null;
  try { data = await r.json(); } catch (_) { data = null; }
  if (!r.ok) throw new Error((data && data.erro) || `Erro ${r.status}`);
  return data;
}

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v; // via CSSOM: permitido pela CSP
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  return el;
}

function render(...nodes) { $app.replaceChildren(...nodes.flat(Infinity).filter((n) => n !== null && n !== undefined && n !== false)); $app.focus(); window.scrollTo(0, 0); }

function aviso(msg, tipo = '') {
  const a = document.getElementById('aviso');
  a.textContent = msg; a.className = `aviso ${tipo}`; a.hidden = !msg;
  if (msg && tipo !== 'erro') setTimeout(() => { if (a.textContent === msg) a.hidden = true; }, 6000);
}

async function seguro(fn) {
  // Limpa apenas avisos de erro antigos; mensagens de sucesso ("salvo") continuam visíveis.
  const a = document.getElementById('aviso');
  if (a.classList.contains('erro')) aviso('');
  try { return await fn(); } catch (e) { aviso(e.message, 'erro'); return null; }
}

function copiar(texto) {
  return h('button', { class: 'btn sec', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(texto); aviso('Copiado.', 'ok'); } catch (_) { aviso('Não foi possível copiar automaticamente. Selecione o texto e copie.', 'erro'); } } }, 'Copiar');
}

function tag(cls, txt) { return h('span', { class: `tag ${cls}` }, txt); }
function voltarInicio() { return h('button', { class: 'btn sec', type: 'button', onclick: telaInicio }, 'Voltar ao início'); }

function tabela(obj) {
  return h('table', {}, Object.entries(obj).map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', {}, typeof v === 'object' ? JSON.stringify(v) : String(v)))));
}

function conformidadeBox(c) {
  if (!c) return null;
  return h('div', { class: 'card' },
    h('p', {}, h('strong', {}, 'Conformidade: '), tag(c.status, c.status.replace('_', ' ')), ' ', c.mensagem),
    c.itens.length ? h('ul', {}, c.itens.map((i) => h('li', {}, tag(i.severidade, i.severidade), ' ', h('strong', {}, `"${i.trecho}"`), ` — ${i.explicacao} `, h('em', {}, `Sugestão: ${i.sugestao}`)))) : null,
    h('p', { class: 'muted' }, c.aviso || ''));
}

function origem(d, money) {
  if (!d || d.valor === null || d.valor === undefined) return h('span', { class: 'muted' }, '— (ausente)');
  const v = money ? `R$ ${Number(d.valor).toFixed(2).replace('.', ',')}` : d.valor;
  const rot = { meta: 'Meta', clinica: 'Clínica', calculo: 'Cálculo', estimativa: 'Estimativa' }[d.origem] || d.origem;
  return h('span', {}, `${v} `, tag(d.origem === 'meta' ? 'meta' : 'verificar', rot));
}

// ---------- carregamento ----------
async function carregarEstado() {
  S.estado = await api('GET', '/api/estado');
  document.getElementById('copyright').textContent = S.estado.copyright;
}

async function carregarClinica(id) {
  const d = await api('GET', `/api/clinicas/${id}`);
  S.clinicaId = id; S.clinica = d.clinica; S.retomada = d.retomada; S.meta = d.meta;
  try { localStorage.setItem('m6d_clinica', id); } catch (_) { /* opcional */ }
  document.getElementById('clinica-atual').textContent = d.clinica.respostas.clinica.nome_comercial;
}

// ---------- telas ----------
async function telaEscolherClinica() {
  await carregarEstado();
  const lista = S.estado.clinicas;
  const nome = h('input', { type: 'text', placeholder: 'Ex.: Clínica Bella Pele', 'aria-label': 'Nome da clínica' });
  render(
    h('h1', {}, 'Bem-vinda'),
    h('p', { class: 'muted' }, 'Escolha a clínica ou cadastre uma nova. Os dados de cada clínica ficam separados.'),
    lista.length ? h('div', { class: 'grade' }, lista.map((c) => h('button', { class: 'opcao', type: 'button', onclick: () => seguro(async () => { await carregarClinica(c.id); telaInicio(); }) }, h('strong', {}, c.nome), h('span', {}, `Atualizada em ${new Date(c.atualizadoEm).toLocaleDateString('pt-BR')}`)))) : null,
    h('div', { class: 'card' }, h('label', {}, 'Cadastrar nova clínica'), nome,
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => { const c = await api('POST', '/api/clinicas', { nome: nome.value }); await carregarClinica(c.id); aviso('Clínica cadastrada e salva.', 'ok'); telaInicio(); }) }, 'Cadastrar')))
  );
}

const PRINCIPAIS = [
  ['whatsapp', 'Quero clientes no WhatsApp', 'Anúncio que leva a conversa direto para o seu WhatsApp'],
  ['seguidores', 'Quero seguidores no Instagram', 'Pessoas da sua região visitando e seguindo o perfil'],
  ['reconhecimento', 'Quero reconhecimento local', 'Ser lembrada na sua região'],
  ['criativo', 'Quero criar um criativo', 'Imagem, carrossel ou vídeo, do zero ou aproveitando o que você tem'],
  ['modelar', 'Quero modelar um anúncio', 'Adaptar uma referência com originalidade'],
  ['monitorar', 'Quero monitorar campanhas', 'Ver resultados e o que fazer agora'],
  ['otimizar', 'Quero otimizar resultados', 'Manter, ajustar, pausar ou escalar com justificativa'],
  ['treinar', 'Quero treinar minha equipe', 'Scripts de WhatsApp, simulações e avaliação'],
  ['historico', 'Quero consultar o histórico', 'Tudo o que foi feito, decidido e registrado'],
];
const EXTRAS = [
  ['crm', 'Retomar contatos (CRM)', 'Contatos, agendamentos e vendas'],
  ['metodo', 'Criar nome de método', 'Nomes memoráveis para um procedimento'],
  ['meta', 'Configurar a Meta', 'Conectar conta de anúncios, página e Instagram'],
  ['cadastro', 'Editar cadastro', 'Rever e corrigir respostas'],
];

async function telaInicio() {
  if (!S.clinicaId) return telaEscolherClinica();
  await seguro(() => carregarClinica(S.clinicaId));
  const r = S.retomada;
  const blocoRetomada = r && (r.tarefaEmAndamento || r.ultimaSessao || r.monitoramentosVencidos.length)
    ? h('div', { class: 'card' },
      h('h3', {}, 'Onde paramos'),
      r.ultimaSessao ? h('p', {}, `Última sessão (${new Date(r.ultimaSessao.quando).toLocaleString('pt-BR')}): ${r.ultimaSessao.solicitacao}`) : null,
      r.monitoramentosVencidos.length ? h('p', {}, tag('atencao', 'monitoramento'), ` ${r.monitoramentosVencidos.length} campanha(s) aguardando monitoramento.`) : null,
      h('p', {}, h('strong', {}, 'Próximo passo: '), r.proximaAcao),
      r.tarefaEmAndamento ? h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => abrirObjetivo(r.tarefaEmAndamento.objetivo, r.tarefaEmAndamento) }, 'Continuar de onde parei')) : null)
    : null;
  const botao = ([k, t, d]) => h('button', { class: 'opcao', type: 'button', onclick: () => abrirObjetivo(k) }, h('strong', {}, t), h('span', {}, d));
  render(
    h('h1', {}, 'O que você quer fazer agora?'),
    h('p', { class: 'muted' }, S.meta.conectada ? 'Meta conectada.' : 'A Meta ainda não está conectada: você pode planejar tudo e publicar depois de conectar.'),
    blocoRetomada,
    h('div', { class: 'grade' }, PRINCIPAIS.map(botao)),
    h('h2', {}, 'Mais opções'),
    h('div', { class: 'grade' }, EXTRAS.map(botao)),
    h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: telaRegistrarSessao }, 'Registrar resumo desta sessão'))
  );
}

function abrirObjetivo(obj, tarefa) {
  S.pilha = [];
  S.fluxo = { objetivo: obj, tarefa: tarefa || null };
  if (obj === 'historico') return telaHistorico();
  if (obj === 'crm') return telaCrm();
  if (obj === 'meta') {
    // Ponto de partida: quem já anuncia vai direto conectar; quem não, recebe o passo a passo.
    return seguro(() => perguntas('meta', () => (S.clinica.respostas.meta || {}).ja_anuncia === 'Sim' ? telaMeta() : perguntas('meta_ativos', telaPreparar)));
  }
  if (obj === 'cadastro') return telaCadastro();
  if (obj === 'monitorar' || obj === 'otimizar') return seguro(async () => { await perguntas(obj, () => telaMonitorar(obj)); });
  if (tarefa && tarefa.campanhaId && tarefa.etapa === 'aprovacao') return telaRevisao(tarefa.campanhaId);
  const depois = { whatsapp: () => telaCriativoCampanha(obj), seguidores: () => telaCriativoCampanha(obj), reconhecimento: () => telaCriativoCampanha(obj), criativo: telaCriativo, modelar: telaModelar, treinar: telaTreinar, metodo: telaMetodo }[obj];
  seguro(async () => {
    await api('POST', `/api/clinicas/${S.clinicaId}/tarefa`, { objetivo: obj, etapa: 'perguntas', titulo: S.estado.objetivos[obj].titulo });
    await perguntas(obj, depois);
  });
}

// Uma pergunta por vez. Nunca mostra pergunta já respondida (exceto ao voltar para editar).
async function perguntas(objetivo, aoTerminar, editarRef) {
  const d = await api('GET', `/api/clinicas/${S.clinicaId}/proximas/${objetivo}`);
  let q = d.faltam[0];
  if (editarRef) {
    const [form] = editarRef.split('.');
    const todas = await api('GET', `/api/perguntas/${form}`);
    q = todas.find((x) => x.ref === editarRef);
    if (q && q.tipo === 'opcao_dinamica') { const [f, k] = q.fonte.split('.'); q = { ...q, tipo: 'opcao', opcoes: S.clinica.respostas[f][k] || [] }; }
  }
  if (!q) return aoTerminar();
  const [form, id] = q.ref.split('.');
  const atual = (S.clinica.respostas[form] || {})[id] ?? q.valorSugerido ?? '';
  let valor = Array.isArray(atual) ? [...atual] : atual;
  const pct = Math.round((d.respondidas / Math.max(d.total, 1)) * 100);
  let campo;
  if (q.tipo === 'opcao' && q.opcoes && q.opcoes.length) {
    campo = h('div', { class: 'chips' }, q.opcoes.map((o) => h('button', { type: 'button', class: `chip ${String(valor) === o ? 'sel' : ''}`, onclick: () => salvar(o) }, o)));
  } else if (q.tipo === 'multi') {
    const sel = new Set(Array.isArray(valor) ? valor : []);
    campo = h('div', {}, h('div', { class: 'chips' }, q.opcoes.map((o) => { const b = h('button', { type: 'button', class: `chip ${sel.has(o) ? 'sel' : ''}`, onclick: () => { sel.has(o) ? sel.delete(o) : sel.add(o); b.classList.toggle('sel'); } }, o); return b; })),
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => salvar([...sel]) }, 'Salvar e continuar')));
  } else {
    const input = q.tipo === 'texto' && /diferenciais|precos|desejos|respostas|perguntas|tentou|abordagens|motivos|perfil|primeira/.test(id)
      ? h('textarea', { value: Array.isArray(valor) ? valor.join(', ') : valor })
      : h('input', { type: q.tipo === 'numero' || q.tipo === 'moeda' ? 'number' : q.tipo === 'data' ? 'date' : q.tipo === 'telefone' ? 'tel' : 'text', value: Array.isArray(valor) ? valor.join(', ') : valor, step: q.tipo === 'moeda' ? '0.01' : undefined, min: q.tipo === 'moeda' || q.tipo === 'numero' ? '0' : undefined });
    input.setAttribute('aria-label', q.texto);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && input.tagName === 'INPUT') salvar(input.value); });
    campo = h('div', {}, input, h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => salvar(input.value) }, 'Salvar e continuar'), !q.obrigatorio ? h('button', { class: 'btn sec', type: 'button', onclick: () => pular() }, 'Pular') : null));
    setTimeout(() => input.focus(), 0);
  }
  async function salvar(v) {
    await seguro(async () => {
      const r = await api('POST', `/api/clinicas/${S.clinicaId}/respostas`, { form, respostas: { [id]: v } });
      if (!r.ok) { aviso(Object.values(r.erros).join(' '), 'erro'); return; }
      if (r.avisoMapa) aviso(r.avisoMapa, 'erro'); else if (r.mudancas.length) aviso('Resposta salva.', 'ok');
      S.pilha.push(q.ref);
      await carregarClinica(S.clinicaId);
      await perguntas(objetivo, aoTerminar);
    });
  }
  async function pular() { await seguro(async () => { await api('POST', `/api/clinicas/${S.clinicaId}/respostas`, { form, respostas: { [id]: '—' } }); S.pilha.push(q.ref); await carregarClinica(S.clinicaId); await perguntas(objetivo, aoTerminar); }); }
  render(
    h('p', { class: 'muted' }, d.titulo),
    h('div', { class: 'progresso', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('div', { style: `width:${pct}%` })),
    h('p', { class: 'muted' }, `${d.respondidas} de ${d.total} informações já cadastradas`),
    h('div', { class: 'card' }, h('h2', {}, q.texto), q.ajuda ? h('p', { class: 'muted' }, q.ajuda) : null, campo),
    h('div', { class: 'linha' },
      S.pilha.length ? h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(() => perguntas(objetivo, aoTerminar, S.pilha.pop())) }, '← Voltar e editar') : null,
      voltarInicio())
  );
}

// ---------- campanha: criativo → texto → revisão → publicação ----------
async function telaCriativoCampanha(objetivo) {
  await api('POST', `/api/clinicas/${S.clinicaId}/tarefa`, { objetivo, etapa: 'criativo', titulo: S.estado.objetivos[objetivo].titulo });
  const lista = await api('GET', `/api/clinicas/${S.clinicaId}/criativos`);
  const usaveis = lista.filter((c) => c.temArquivo || c.instagramMediaId);
  render(
    h('p', { class: 'muted' }, S.estado.objetivos[objetivo].titulo, ' · Etapa 2 de 4'),
    h('h1', {}, 'Qual criativo vamos usar?'),
    usaveis.length ? h('div', { class: 'grade' }, usaveis.map((c) => h('button', { class: 'opcao', type: 'button', onclick: () => telaTexto(objetivo, c.id) }, h('strong', {}, c.titulo), h('span', {}, c.instagramMediaId ? 'Post do Instagram' : c.nomeArquivo || 'Imagem')))) : h('p', { class: 'muted' }, 'Nenhum criativo salvo ainda.'),
    formNovoCriativo((c) => telaTexto(objetivo, c.id)),
    h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: () => telaCriativo() }, 'Ainda não tenho: quero criar um'), voltarInicio())
  );
}

function formNovoCriativo(depois) {
  const titulo = h('input', { type: 'text', placeholder: 'Nome para identificar (ex.: Vídeo avaliação maio)' });
  const arquivo = h('input', { type: 'file', accept: 'image/jpeg,image/png' });
  const media = h('input', { type: 'text', placeholder: 'ID do post do Instagram (opcional)' });
  return h('div', { class: 'card' },
    h('h3', {}, 'Adicionar criativo'),
    h('label', {}, 'Nome'), titulo,
    h('label', {}, 'Imagem (JPG ou PNG, até 8 MB)'), arquivo,
    h('label', {}, 'Ou um post do Instagram que foi bem'), media,
    h('p', { class: 'muted' }, 'Vídeos: publique primeiro no Instagram e use o ID do post. Envio direto de vídeo ainda não é suportado nesta versão.'),
    h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
      const body = { titulo: titulo.value || 'Criativo', instagramMediaId: media.value.trim() || null, origem: media.value.trim() ? 'instagram' : 'arquivo' };
      if (arquivo.files[0]) { body.imagemBase64 = await lerArquivo(arquivo.files[0]); body.nomeArquivo = arquivo.files[0].name; }
      if (!body.imagemBase64 && !body.instagramMediaId) throw new Error('Envie uma imagem ou informe o ID do post.');
      const c = await api('POST', `/api/clinicas/${S.clinicaId}/criativos`, body);
      aviso('Criativo salvo.', 'ok'); depois(c);
    }) }, 'Salvar criativo')));
}

function lerArquivo(f) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('Não foi possível ler o arquivo.')); r.readAsDataURL(f); });
}

async function telaTexto(objetivo, criativoId) {
  const variantes = await api('GET', `/api/clinicas/${S.clinicaId}/copies/${objetivo}`);
  const titulo = h('input', { type: 'text', value: variantes[0].titulo });
  const texto = h('textarea', { value: variantes[0].textoPrincipal, rows: 8 });
  const nomeAt = String(((S.clinica.respostas.atendimento || {}).nome_atendimento) || 'Avaliação').toLowerCase();
  const botoes = objetivo === 'whatsapp' ? [`Quero agendar minha ${nomeAt}`, `Como funciona a ${nomeAt}?`, 'Quero saber mais sobre o procedimento'].map((v) => h('input', { type: 'text', maxlength: '80', value: v })) : null;
  const resultado = h('div', {});
  const verificar = () => seguro(async () => { const c = await api('POST', '/api/compliance', { textos: [texto.value, titulo.value], ofertaValidade: S.clinica.respostas.campanha.oferta_validade, destino: objetivo, informacoesValidadas: S.clinica.respostas.clinica.informacoes_validadas }); resultado.replaceChildren(conformidadeBox(c)); });
  render(
    h('p', { class: 'muted' }, S.estado.objetivos[objetivo].titulo, ' · Etapa 3 de 4'),
    h('h1', {}, 'Escolha o texto do anúncio'),
    h('p', { class: 'muted' }, 'Toque em uma opção para usar. Você pode editar à vontade.'),
    h('div', { class: 'grade' }, variantes.map((v) => h('button', { class: 'opcao', type: 'button', onclick: () => { titulo.value = v.titulo; texto.value = v.textoPrincipal; verificar(); } }, h('strong', {}, v.angulo), h('span', {}, v.titulo), h('div', {}, tag(v.conformidade.status, v.conformidade.status.replace('_', ' ')))))),
    h('div', { class: 'card' }, h('label', {}, 'Título'), titulo, h('label', {}, 'Texto principal'), texto,
      botoes ? [h('label', {}, 'Botões que aparecem no WhatsApp da cliente (gatilhos do fluxo no CRM)'), ...botoes.flatMap((b, i) => [h('p', { class: 'muted' }, ['Cliente decidida (vai direto para a agenda)', 'Cliente interessada (explica e convida)', 'Cliente curiosa (conversa e convida)'][i]), b]), h('p', { class: 'muted' }, 'Cadastre exatamente estas frases como gatilhos no fluxo do CRM, uma para cada ramo. Deixe um botão em branco para não usá-lo.')] : null,
      h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: verificar }, 'Verificar conformidade'),
        h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
          const r = await api('POST', `/api/clinicas/${S.clinicaId}/campanhas/rascunho`, { objetivo, criativoId, copy: { titulo: titulo.value, textoPrincipal: texto.value, ...(botoes ? { botoes: botoes.map((b) => b.value.trim()).filter(Boolean) } : {}) } });
          telaRevisao(r.campanha.id, r.plano);
        }) }, 'Revisar campanha'))),
    resultado,
    h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: () => telaCriativoCampanha(objetivo) }, '← Voltar'), voltarInicio())
  );
  verificar();
}

async function telaRevisao(campanhaId, plano) {
  const cp = await api('GET', `/api/clinicas/${S.clinicaId}/campanhas/${campanhaId}`);
  const resumo = plano ? plano.resumo : cp.resumo;
  const pend = plano ? plano.pendencias : cp.pendencias;
  const conf = plano ? plano.conformidade : cp.conformidade;
  const chk = h('input', { type: 'checkbox', id: 'conf' });
  const frase = h('input', { type: 'text', placeholder: 'Digite PUBLICAR' });
  const out = h('div', {});
  const pode = pend.length === 0 && S.meta.conectada;
  render(
    h('p', { class: 'muted' }, 'Etapa 4 de 4 · Revisão e aprovação'),
    h('h1', {}, 'Confira antes de publicar'),
    h('div', { class: 'card' }, tabela(resumo)),
    plano && plano.observacao ? h('p', { class: 'aviso' }, plano.observacao) : null,
    pend.length ? h('div', { class: 'card' }, h('h3', {}, 'O que ainda impede a publicação'), h('ul', {}, pend.map((p) => h('li', {}, p)))) : null,
    !S.meta.conectada ? h('p', {}, tag('atencao', 'Meta'), ' A Meta não está conectada. ', h('button', { class: 'link', type: 'button', onclick: telaMeta }, 'Configurar agora')) : null,
    conformidadeBox(conf),
    h('div', { class: 'card' },
      h('h3', {}, 'Aprovação da gestora'),
      h('p', {}, 'Ao publicar, a campanha será criada no Gerenciador de Anúncios, programada para começar no horário indicado e poderá gerar cobrança na sua conta de anúncios.'),
      h('label', { for: 'conf' }, chk, ' Revisei os dados e autorizo a publicação'),
      h('label', {}, 'Para confirmar, digite PUBLICAR'), frase,
      h('div', { class: 'linha' },
        h('button', { class: 'btn', type: 'button', disabled: !pode, title: pode ? '' : 'Resolva as pendências acima', onclick: () => seguro(async () => {
          out.replaceChildren(h('p', {}, 'Publicando… não feche esta janela.'));
          const r = await api('POST', `/api/clinicas/${S.clinicaId}/campanhas/${campanhaId}/publicar`, { confirmacao: chk.checked, frase: frase.value });
          out.replaceChildren(resultadoPublicacao(r));
        }) }, 'Publicar campanha'),
        h('button', { class: 'btn sec', type: 'button', onclick: telaInicio }, 'Salvar como rascunho e sair'))),
    out
  );
}

function resultadoPublicacao(r) {
  const rot = { programada: 'Programada', em_revisao: 'Em revisão pela Meta', ativa: 'Ativa', reprovada: 'Reprovada', com_erro: 'Com erro', erro_publicacao: 'Erro na publicação', pausada: 'Pausada' };
  return h('div', { class: 'card' },
    h('h3', {}, 'Resultado real retornado pela Meta'),
    h('p', {}, tag(r.estado, rot[r.estado] || r.estado), r.effectiveStatus ? ` (status da Meta: ${r.effectiveStatus})` : ''),
    r.erro ? h('p', {}, r.erro) : null,
    r.aviso ? h('p', { class: 'muted' }, r.aviso) : null,
    r.ids && Object.keys(r.ids).length ? tabela(r.ids) : null,
    h('ul', {}, (r.passos || []).map((p) => h('li', {}, p.ok ? '✔ ' : '✖ ', p.passo.replace(/_/g, ' '), p.explicacao ? ` — ${p.explicacao}` : ''))),
    r.proximoMonitoramento ? h('p', {}, h('strong', {}, 'Próximo monitoramento: '), new Date(r.proximoMonitoramento).toLocaleString('pt-BR')) : null,
    voltarInicio());
}

// ---------- criativos ----------
async function telaCriativo() {
  const tipo = (S.clinica.respostas.criativo || {}).formato || 'Imagem';
  const corpo = h('div', {});
  const abas = h('div', { class: 'abas' });
  const mostrar = async (aba) => {
    [...abas.children].forEach((b) => b.classList.toggle('sel', b.dataset.aba === aba));
    if (aba === 'imagem') {
      const p = await api('GET', `/api/clinicas/${S.clinicaId}/criativo/estatico`);
      corpo.replaceChildren(h('div', { class: 'card' }, h('h3', {}, 'Prompt completo para gerar a imagem'), h('pre', {}, p.prompt), copiar(p.prompt)), conformidadeBox(p.conformidade));
    } else if (aba === 'video') {
      const v = await api('GET', `/api/clinicas/${S.clinicaId}/criativo/video`);
      const txt = v.cenas.map((c) => `${c.tempo}\nCena: ${c.cena}\nFala: ${c.fala}\nTexto na tela: ${c.textoTela}`).join('\n\n');
      corpo.replaceChildren(h('div', { class: 'card' }, h('h3', {}, `Roteiro de ${v.duracao}s`), h('p', {}, h('strong', {}, 'Gancho: '), v.gancho), h('pre', {}, txt), copiar(txt),
        h('h3', {}, 'Gravação'), h('ul', {}, v.gravacao.map((g) => h('li', {}, g))), h('h3', {}, 'Edição'), h('ul', {}, v.edicao.map((g) => h('li', {}, g))), h('p', {}, h('strong', {}, 'CTA: '), v.cta)), conformidadeBox(v.conformidade));
    } else if (aba === 'analise') {
      const crit = { gancho: 'Gancho prende nos primeiros segundos', hierarquia: 'Hierarquia visual clara', copy: 'Texto simples e sem promessa', oferta: 'Oferta real (se houver)', beneficio: 'Benefício claro', cta: 'Chamada para ação clara', paleta: 'Cores da clínica', contraste: 'Bom contraste', legibilidade: 'Legível no celular', identidade: 'Reconhece-se a clínica' };
      const marc = {};
      corpo.replaceChildren(h('div', { class: 'card' }, h('h3', {}, 'Analise uma peça que você já tem'), h('p', { class: 'muted' }, 'Marque Sim ou Não para cada item.'),
        ...Object.entries(crit).map(([k, t]) => h('div', { class: 'linha' }, h('span', { style: 'flex:1' }, t), ...['Sim', 'Não'].map((o) => { const b = h('button', { type: 'button', class: 'chip', onclick: () => { marc[k] = o === 'Sim'; b.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); } }, o); return b; }))),
        h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => { const r = await api('POST', `/api/clinicas/${S.clinicaId}/criativo/analise`, { respostas: marc }); aviso(r.recomendacao, r.falhas.length ? 'erro' : 'ok'); }) }, 'Ver recomendação'))));
    } else {
      corpo.replaceChildren(formNovoCriativo(() => { aviso('Criativo salvo na biblioteca da clínica.', 'ok'); telaInicio(); }));
    }
  };
  for (const [k, t] of [['imagem', 'Imagem'], ['video', 'Vídeo'], ['analise', 'Analisar peça'], ['salvar', 'Salvar criativo']]) abas.append(h('button', { class: 'aba', type: 'button', 'data-aba': k, onclick: () => seguro(() => mostrar(k)) }, t));
  render(h('h1', {}, 'Criativo'), h('p', { class: 'muted' }, 'Tudo é montado com os dados reais da clínica. Itens marcados [A CONFIRMAR] precisam ser preenchidos.'), abas, corpo, h('div', { class: 'linha' }, voltarInicio()));
  await seguro(() => mostrar(tipo === 'Vídeo' ? 'video' : 'imagem'));
}

async function telaModelar() {
  const link = h('input', { type: 'text', placeholder: 'Link do anúncio na Biblioteca de Anúncios' });
  const estrutura = h('textarea', { placeholder: 'O que funciona na estrutura (gancho, formato, ordem das ideias) — não copie frases nem imagens.' });
  const dias = h('input', { type: 'number', min: '0', placeholder: 'Há quantos dias está ativo?' });
  const dados = (S.clinica.respostas.criativo || {}).referencia_dados;
  render(
    h('h1', {}, 'Modelar um anúncio'),
    h('div', { class: 'card' }, h('p', {}, '1. Abra a Biblioteca de Anúncios: ', h('a', { href: 'https://www.facebook.com/ads/library/', target: '_blank', rel: 'noopener noreferrer' }, 'facebook.com/ads/library')),
      h('p', {}, '2. Filtre por Brasil, "Todos os anúncios" e procure por procedimento + cidade.'),
      h('p', {}, '3. Anúncios ativos há mais de 10 dias são referências possíveis — estar ativo não prova que dá lucro.'),
      dados === 'Não sei, só gostei' || dados === 'É de outra clínica' ? h('p', {}, tag('verificar', 'hipótese'), ' Sem dados de desempenho, esta referência é só uma hipótese a testar.') : null),
    h('div', { class: 'card' }, h('label', {}, 'Link'), link, h('label', {}, 'Dias ativo'), dias, h('label', {}, 'Estrutura que você quer adaptar'), estrutura,
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
        await api('POST', `/api/clinicas/${S.clinicaId}/criativos`, { titulo: 'Referência modelada', formato: 'referencia', origem: 'referencia', referencia: { link: link.value, diasAtivo: Number(dias.value) || null, estrutura: estrutura.value, evidencia: dados || 'não informada', status: 'hipotese' } });
        aviso('Referência registrada como hipótese.', 'ok'); telaCriativo();
      }) }, 'Registrar e criar versão original'))),
    h('div', { class: 'linha' }, voltarInicio()));
}

// ---------- monitoramento e otimização ----------
async function telaMonitorar(modo) {
  const campanhas = (await api('GET', `/api/clinicas/${S.clinicaId}/campanhas`)).filter((c) => c.estado !== 'rascunho' || modo === 'otimizar');
  render(
    h('h1', {}, modo === 'otimizar' ? 'Otimizar resultados' : 'Monitorar campanhas'),
    !campanhas.length ? h('p', {}, 'Nenhuma campanha registrada ainda.') : null,
    ...campanhas.map((c) => h('div', { class: 'card' },
      h('h3', {}, c.nome), h('p', {}, tag(c.estado, c.estado.replace(/_/g, ' ')), c.proximoMonitoramento ? ` · Próximo monitoramento: ${new Date(c.proximoMonitoramento).toLocaleString('pt-BR')}` : ''),
      c.ultimaDecisao ? h('p', { class: 'muted' }, `Última decisão: ${c.ultimaDecisao.decisao} — ${c.ultimaDecisao.justificativa}`) : null,
      h('div', { class: 'linha' },
        c.estado === 'rascunho' || c.estado === 'erro_publicacao' ? h('button', { class: 'btn', type: 'button', onclick: () => telaRevisao(c.id) }, 'Revisar e publicar') : null,
        c.metaIds && c.metaIds.campaignId ? h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => { await api('POST', `/api/clinicas/${S.clinicaId}/campanhas/${c.id}/status`, { confirmacao: true }); aviso('Status atualizado com a Meta.', 'ok'); telaMonitorar(modo); }) }, 'Atualizar status') : null,
        c.estado !== 'rascunho' ? h('button', { class: 'btn', type: 'button', onclick: () => telaFormMonitoramento(c) }, 'Monitorar agora') : null))),
    h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => { const r = await api('POST', `/api/clinicas/${S.clinicaId}/relatorio-semanal`); render(h('h1', {}, 'Relatório semanal'), h('pre', {}, r.markdown), copiar(r.markdown), h('div', { class: 'linha' }, voltarInicio())); }) }, 'Gerar relatório semanal'), voltarInicio()));
}

function telaFormMonitoramento(c) {
  const campos = {
    custoAlvo: h('input', { type: 'number', step: '0.01', min: '0', placeholder: 'Quanto você aceita pagar por resultado? (R$)' }),
    seguidoresAtribuidos: h('input', { type: 'number', min: '0', placeholder: 'Seguidores atribuídos pela Meta (se aparecer no Gerenciador)' }),
    crescimentoPerfil: h('input', { type: 'number', placeholder: 'Quanto o perfil cresceu no período' }),
    objecoes: h('textarea', { placeholder: 'Quais objeções apareceram?' }),
    aprendizado: h('textarea', { placeholder: 'O que aprendemos nesta rodada?' }),
  };
  const sel = (nome, opcoes) => { const s = h('select', {}, opcoes.map((o) => h('option', { value: o[0] }, o[1]))); campos[nome] = s; return s; };
  const out = h('div', {});
  render(
    h('h1', {}, `Monitorar: ${c.nome}`),
    h('p', { class: 'muted' }, 'Os números de anúncio vêm da Meta. Contatos, agendamentos e vendas vêm do CRM desta clínica (cadastre-os em "Retomar contatos"). Responda o que souber.'),
    h('div', { class: 'card' },
      h('label', {}, 'Custo aceitável por resultado (R$)'), campos.custoAlvo,
      c.objetivo === 'seguidores' ? [h('label', {}, 'Seguidores atribuídos'), campos.seguidoresAtribuidos, h('label', {}, 'Crescimento do perfil'), campos.crescimentoPerfil] : null,
      h('label', {}, 'Houve demora para responder?'), sel('houveDemora', [['nao', 'Não'], ['sim', 'Sim']]),
      h('label', {}, 'Ainda há horários disponíveis para novas clientes?'), sel('capacidadeDisponivel', [['sim', 'Sim'], ['nao', 'Não, agenda cheia']]),
      h('label', {}, 'Objeções'), campos.objecoes, h('label', {}, 'Aprendizado'), campos.aprendizado,
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
        const rg = {};
        for (const [k, el] of Object.entries(campos)) if (el.value !== '') rg[k] = el.value;
        const r = await api('POST', `/api/clinicas/${S.clinicaId}/campanhas/${c.id}/monitorar`, { respostasGestora: rg, aprendizado: rg.aprendizado || null });
        out.replaceChildren(resultadoMonitoramento(c, r.monitoramento, r.proximoMonitoramento));
      }) }, 'Analisar'))),
    out, h('div', { class: 'linha' }, voltarInicio()));
}

function resultadoMonitoramento(c, m, prox) {
  const met = m.metricas;
  const just = h('textarea', { placeholder: 'Por que essa decisão? (obrigatório)' });
  const decidir = (d) => seguro(async () => {
    await api('POST', `/api/clinicas/${S.clinicaId}/campanhas/${c.id}/decisao`, { decisao: d, justificativa: just.value });
    aviso('Decisão registrada.', 'ok');
    if (d === 'pausar' && c.metaIds && confirm('Pausar a campanha agora na Meta? Ela para de gastar imediatamente.')) {
      await api('POST', `/api/clinicas/${S.clinicaId}/campanhas/${c.id}/status`, { acao: 'pausar', confirmacao: true, justificativa: just.value });
      aviso('Campanha pausada na Meta.', 'ok');
    }
  });
  return h('div', {},
    h('div', { class: 'card' }, h('h3', {}, 'Números'), h('table', {},
      [['Investimento', met.investimento, true], ['Impressões', met.impressoes], ['Alcance', met.alcance], ['CPM', met.cpm, true], ['Frequência', met.frequencia], ['CTR (%)', met.ctr], ['CPC', met.cpc, true], ['Conversas', met.conversas], ['Custo por conversa', met.custoPorConversa, true],
        ['Contatos no CRM', m.funil.contatos], ['Qualificados', m.funil.qualificados], ['Agendados', m.funil.agendados], ['Compareceram', m.funil.compareceram], ['Vendas', m.funil.vendas], ['Faturamento', m.funil.faturamento, true]]
        .map(([k, d, money]) => h('tr', {}, h('th', {}, k), h('td', {}, origem(d, money))))),
      m.fonte !== 'meta' ? h('p', {}, tag('atencao', 'sem Meta'), ' Esta campanha não tem identificador na Meta: só os dados do CRM foram usados.') : null,
      m.custoSeguidor ? h('p', {}, h('strong', {}, 'Custo por seguidor: '), m.custoSeguidor.valor === null ? 'não calculável' : `R$ ${m.custoSeguidor.valor}`, ' ', tag(m.custoSeguidor.faixa, m.custoSeguidor.faixa), ' ', m.custoSeguidor.explicacao) : null),
    h('div', { class: 'card' }, h('h3', {}, 'Diagnóstico'), h('p', {}, m.diagnostico.conclusao), h('ul', {}, m.diagnostico.achados.map((a) => h('li', {}, h('strong', {}, a.gargalo), `: ${a.acao}`))),
      m.diagnostico.dadosAusentes.length ? h('p', { class: 'muted' }, `Dados ausentes: ${m.diagnostico.dadosAusentes.join(', ')}`) : null, h('p', { class: 'muted' }, m.diagnostico.aviso)),
    h('div', { class: 'card' }, h('h3', {}, 'Criativos'), m.classificacoes.length ? h('ul', { class: 'limpa' }, m.classificacoes.map((cl) => h('li', {}, h('strong', {}, cl.anuncio || cl.anuncioId || 'anúncio'), ' ', tag(cl.classe, cl.rotulo), h('div', { class: 'muted' }, cl.justificativa.join(' '))))) : h('p', { class: 'muted' }, 'Sem dados por anúncio.')),
    h('div', { class: 'card' }, h('h3', {}, 'Decisão'), just,
      h('div', { class: 'chips' }, [['manter', 'Manter'], ['ajustar', 'Ajustar'], ['testar_variacao', 'Testar variação'], ['escalar', 'Escalar gradualmente'], ['pausar', 'Pausar']].map(([k, t]) => h('button', { class: 'chip', type: 'button', onclick: () => decidir(k) }, t))),
      h('p', { class: 'muted' }, `Próximo monitoramento registrado: ${new Date(prox).toLocaleString('pt-BR')}`)));
}

// ---------- atendimento e treinamento ----------
async function telaTreinar() {
  const [s, t] = await Promise.all([api('GET', `/api/clinicas/${S.clinicaId}/scripts`), api('GET', `/api/clinicas/${S.clinicaId}/treinamento`)]);
  const notas = {};
  const pessoa = h('input', { type: 'text', placeholder: 'Nome de quem foi avaliada' });
  render(
    h('h1', {}, 'Atendimento e treinamento'),
    h('div', { class: 'card' }, h('h3', {}, 'Scripts de WhatsApp'), ...Object.entries(s.scripts).map(([k, v]) => h('div', {}, h('p', {}, h('strong', {}, k.replace(/([A-Z])/g, ' $1').toLowerCase())), h('pre', {}, v), copiar(v))),
      h('h3', {}, 'Regras'), h('ul', {}, s.regras.map((r) => h('li', {}, r)))),
    s.objeções.length ? h('div', { class: 'card' }, h('h3', {}, 'Objeções da sua clínica'), h('table', {}, s.objeções.map((o) => h('tr', {}, h('th', {}, o.objecao), h('td', {}, o.resposta, h('div', { class: 'muted' }, `Ideia de conteúdo: ${o.conteudo}`)))))) : null,
    h('div', { class: 'card' }, h('h3', {}, 'Módulos'), h('ol', {}, t.modulos.map((m) => h('li', {}, m))), h('h3', {}, 'Simulações'), h('ol', {}, t.simulacoes.map((x) => h('li', {}, x.situacao, h('div', { class: 'muted' }, x.respostaEsperada))))),
    h('div', { class: 'card' }, h('h3', {}, 'Avaliar uma simulação'), pessoa,
      ...t.criterios.map((c) => h('div', { class: 'linha' }, h('span', { style: 'flex:1' }, `${c.criterio} — ${c.descricao}`), ...[0, 1, 2].map((n) => { const b = h('button', { class: 'chip', type: 'button', onclick: () => { notas[c.criterio] = n; b.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.remove('sel')); b.classList.add('sel'); } }, String(n)); return b; }))),
      h('p', { class: 'muted' }, t.escala),
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
        const r = await api('POST', `/api/clinicas/${S.clinicaId}/treinamento/avaliacao`, { notas, pessoa: pessoa.value });
        aviso(`${r.nivel}: ${r.percentual}%. ${r.planoMelhoria.length ? 'Melhorar: ' + r.planoMelhoria[0] : ''}`, 'ok');
      }) }, 'Registrar avaliação'))),
    h('div', { class: 'linha' }, voltarInicio()));
}

async function telaMetodo() {
  const r = S.clinica.respostas;
  const proc = h('select', {}, (r.clinica.procedimentos_prioritarios || []).map((p) => h('option', { value: p }, p)));
  const desejo = h('input', { type: 'text', value: r.publico.desejos || '', placeholder: 'O que a cliente deseja' });
  const dif = h('textarea', { value: r.clinica.diferenciais || '' });
  const dur = h('input', { type: 'text', placeholder: 'Duração real do atendimento (ex.: 40 minutos)' });
  const out = h('div', {});
  render(h('h1', {}, 'Nome de método'),
    h('p', { class: 'muted' }, 'O nome precisa representar algo que a clínica realmente faz. Não criamos técnicas, exclusividades ou promessas.'),
    h('div', { class: 'card' }, h('label', {}, 'Procedimento'), proc, h('label', {}, 'Desejo da cliente'), desejo, h('label', {}, 'Diferencial real'), dif, h('label', {}, 'Duração real'), dur,
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
        const res = await api('POST', `/api/clinicas/${S.clinicaId}/metodo`, { procedimento: proc.value, desejo: desejo.value, diferencial: dif.value, duracao: dur.value });
        out.replaceChildren(...res.nomes.map((n) => h('div', { class: 'card' }, h('h3', {}, n.nome, ' ', tag(n.conformidade.status, n.conformidade.status.replace('_', ' '))), tabela({ Conceito: n.conceito, Benefício: n.beneficioComunicado, 'Diferencial real': n.diferencialReal, Headline: n.headline, Copy: n.copy, 'Ideia de criativo': n.ideiaCriativo, Roteiro: n.roteiro, CTA: n.cta, 'Perguntas frequentes': n.faq.join(' · '), 'Limitações e ressalvas': n.limitacoes }))));
        aviso('Nomes gerados e salvos na biblioteca da clínica.', 'ok');
      }) }, 'Gerar nomes'))), out, h('div', { class: 'linha' }, voltarInicio()));
}

// ---------- CRM ----------
async function telaCrm() {
  const d = await api('GET', `/api/clinicas/${S.clinicaId}/crm`);
  const campanhas = await api('GET', `/api/clinicas/${S.clinicaId}/campanhas`);
  const f = { nome: h('input', { type: 'text', placeholder: 'Primeiro nome' }), telefone: h('input', { type: 'tel', placeholder: 'WhatsApp (opcional)' }), procedimento: h('input', { type: 'text', placeholder: 'Procedimento de interesse' }),
    origem: h('select', {}, ['anuncio', 'instagram_organico', 'indicacao', 'retorno', 'desconhecida'].map((o) => h('option', { value: o }, o.replace('_', ' ')))),
    campanhaId: h('select', {}, h('option', { value: '' }, 'Campanha: não identificada'), campanhas.map((c) => h('option', { value: c.id }, c.nome))) };
  const consent = h('input', { type: 'checkbox' });
  const etapas = [...d.etapas, ...d.alternativas];
  render(
    h('h1', {}, 'Contatos e vendas'),
    h('div', { class: 'card' }, h('h3', {}, 'Funil (dados registrados pela clínica)'), h('table', {}, [['Contatos', d.funil.contatos], ['Em atendimento', d.funil.responderam], ['Qualificados', d.funil.qualificados], ['Agendados', d.funil.agendados], ['Compareceram', d.funil.compareceram], ['Vendas', d.funil.vendas], ['Faturamento', d.funil.faturamento, true]].map(([k, v, m]) => h('tr', {}, h('th', {}, k), h('td', {}, origem(v, m)))))),
    h('div', { class: 'card' }, h('h3', {}, 'Novo contato'), f.nome, h('br'), f.telefone, h('br'), f.procedimento, h('label', {}, 'De onde veio?'), f.origem, h('label', {}, 'Campanha'), f.campanhaId,
      h('label', {}, consent, ' A pessoa autorizou receber mensagens da clínica'),
      h('p', { class: 'muted' }, 'Não registre informações de saúde aqui. Guarde só o necessário para o atendimento.'),
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
        await api('POST', `/api/clinicas/${S.clinicaId}/crm`, { nome: f.nome.value, telefone: f.telefone.value, procedimento: f.procedimento.value, origem: f.origem.value, campanhaId: f.campanhaId.value || undefined, consentimentoContato: consent.checked });
        aviso('Contato salvo.', 'ok'); telaCrm();
      }) }, 'Salvar contato'))),
    h('h2', {}, `Contatos (${d.contatos.length})`),
    ...d.contatos.slice().reverse().map((c) => {
      const et = h('select', {}, etapas.map((e) => h('option', { value: e, selected: e === c.etapa }, d.rotulos[e])));
      const valor = h('input', { type: 'number', step: '0.01', min: '0', placeholder: 'Valor vendido', value: c.valorVendido ?? '' });
      const motivo = h('input', { type: 'text', placeholder: 'Motivo de perda (se houver)', value: c.motivoPerda || '' });
      const prox = h('input', { type: 'text', placeholder: 'Próxima ação', value: c.proximaAcao || '' });
      return h('div', { class: 'card' }, h('h3', {}, c.nome, ' ', tag(c.etapa, d.rotulos[c.etapa])), h('p', { class: 'muted' }, `${c.procedimento || '—'} · entrada ${c.dataEntrada} · origem ${c.origem}${c.campanhaId ? ' · campanha vinculada' : ''}`),
        et, h('br'), valor, h('br'), motivo, h('br'), prox,
        h('div', { class: 'linha' },
          h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => { await api('PATCH', `/api/clinicas/${S.clinicaId}/crm/${c.id}`, { etapa: et.value, valorVendido: valor.value === '' ? undefined : valor.value, motivoPerda: motivo.value, proximaAcao: prox.value }); aviso('Contato atualizado.', 'ok'); telaCrm(); }) }, 'Salvar'),
          h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => { if (!confirm('Excluir este contato definitivamente (pedido da pessoa / LGPD)?')) return; await api('DELETE', `/api/clinicas/${S.clinicaId}/crm/${c.id}`, { confirmacao: true, motivo: 'pedido do titular' }); aviso('Contato excluído.', 'ok'); telaCrm(); }) }, 'Excluir')));
    }),
    h('div', { class: 'linha' }, voltarInicio()));
}

// ---------- Meta ----------
async function telaPreparar() {
  const g = await api('GET', `/api/clinicas/${S.clinicaId}/meta/guia`);
  render(
    h('h1', {}, 'Preparar as contas da clínica'),
    h('p', { class: 'muted' }, 'Estas etapas são feitas pela dona da clínica, logada no Facebook dela. O sistema não cria página nem cadastra pagamento: ele guia e depois confere tudo automaticamente.'),
    g.jaTem.length ? h('p', {}, tag('meta', 'pronto'), ' ', g.jaTem.join(' · ')) : null,
    ...g.faltam.map((p, i) => h('div', { class: 'card' },
      h('h3', {}, `${i + 1}. ${p.titulo} `, tag(p.resposta === 'Não' ? 'atencao' : 'verificar', p.resposta === 'Não' ? 'falta' : 'conferir')),
      h('p', { class: 'muted' }, p.porque),
      h('ol', {}, p.como.map((c) => h('li', {}, c))),
      h('p', {}, h('a', { href: p.link, target: '_blank', rel: 'noopener noreferrer' }, 'Abrir na Meta ↗')),
      h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => {
        await api('POST', `/api/clinicas/${S.clinicaId}/respostas`, { form: 'meta', respostas: { [p.pergunta]: 'Sim' } });
        aviso(`Anotado: ${p.titulo}.`, 'ok'); await carregarClinica(S.clinicaId); telaPreparar();
      }) }, 'Já fiz esta etapa'),
      S.meta && S.meta.conectada ? h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => {
        const d = await api('GET', `/api/clinicas/${S.clinicaId}/meta/diagnostico`);
        const it = d.itens.find((x) => x.id === p.id);
        if (!it) return aviso('Esta etapa não pode ser verificada pela API.', 'erro');
        if (it.status === 'ok') {
          await api('POST', `/api/clinicas/${S.clinicaId}/respostas`, { form: 'meta', respostas: { [p.pergunta]: 'Sim' } });
          aviso(`Confirmado pela Meta: ${it.detalhe}`, 'ok'); await carregarClinica(S.clinicaId); return telaPreparar();
        }
        aviso(`${it.status === 'falta' ? 'Ainda falta' : 'Não deu para confirmar pela API'}: ${it.detalhe}`, 'erro');
      }) }, 'Verificar agora pela API') : null))),
    g.pronto ? h('div', { class: 'card' }, h('h3', {}, 'Tudo preparado'), h('p', {}, 'Agora conecte a Meta ao sistema. Depois de conectar, o sistema confere cada item de verdade pela API.')) : h('p', {}, h('strong', {}, 'Próximo passo: '), g.proximoPasso),
    h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(telaMeta) }, g.pronto ? 'Conectar a Meta' : 'Já tenho tudo: conectar a Meta'), voltarInicio()));
}

function diagnosticoBox(d) {
  const rot = { ok: ['meta', 'pronto'], falta: ['critica', 'falta'], verificar: ['verificar', 'conferir'] };
  return h('div', { class: 'card' },
    h('h3', {}, 'Conferência automática pela API ', tag(d.pronto ? 'meta' : 'atencao', d.pronto ? 'pronto' : 'pendências')),
    h('p', {}, d.resumo),
    h('ul', { class: 'limpa' }, d.itens.map((i) => h('li', {}, tag(rot[i.status][0], rot[i.status][1]), ' ', h('strong', {}, i.titulo), h('div', { class: 'muted' }, i.detalhe),
      i.como.length ? h('ol', {}, i.como.map((c) => h('li', {}, c))) : null,
      i.link && i.status !== 'ok' ? h('a', { href: i.link, target: '_blank', rel: 'noopener noreferrer' }, 'Resolver na Meta ↗') : null))),
    h('p', {}, h('strong', {}, 'Próximo passo: '), d.proximoPasso));
}

async function telaMeta() {
  await carregarEstado();
  await carregarClinica(S.clinicaId);
  const appOk = S.estado.metaApp.configurado;
  const appId = h('input', { type: 'text', placeholder: 'ID do app (números)' });
  const appSecret = h('input', { type: 'password', autocomplete: 'off', placeholder: 'Chave secreta do app' });
  const tokenManual = h('input', { type: 'password', autocomplete: 'off', placeholder: 'Cole o token aqui (fica cifrado neste computador)' });
  const ativosBox = h('div', {});
  const diagBox = h('div', {});
  render(
    h('h1', {}, 'Configurar a Meta'),
    h('p', { class: 'muted' }, `Credenciais ficam cifradas neste computador (${S.estado.cofre === 'dpapi' ? 'proteção do Windows' : 'chave local'}). Nunca cole tokens no chat. API ${S.estado.apiVersion}.`),
    h('div', { class: 'card' }, h('h3', {}, '1. App da Meta ', appOk ? tag('meta', 'configurado') : tag('atencao', 'pendente')),
      appOk ? h('p', {}, `App ${S.estado.metaApp.appId}`) : h('p', { class: 'muted' }, 'Feito uma única vez por quem administra o sistema. Veja docs/CONFIGURACAO-META.md.'),
      h('label', {}, 'ID do app'), appId, h('label', {}, 'Chave secreta'), appSecret,
      h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => { await api('POST', '/api/meta/app', { appId: appId.value, appSecret: appSecret.value }); appSecret.value = ''; aviso('App salvo com segurança.', 'ok'); telaMeta(); }) }, 'Salvar app'))),
    h('div', { class: 'card' }, h('h3', {}, '2. Conectar a conta ', S.meta.conectada ? tag('meta', 'conectada') : tag('atencao', 'não conectada')),
      S.meta.expiraEm ? h('p', {}, `Acesso válido até ${new Date(S.meta.expiraEm).toLocaleDateString('pt-BR')}. Reconecte antes disso.`) : null,
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', disabled: !appOk, onclick: () => seguro(async () => { const r = await api('GET', `/api/clinicas/${S.clinicaId}/meta/conectar`); window.location.href = r.url; }) }, 'Entrar com Facebook')),
      h('details', {}, h('summary', {}, 'Alternativa: usar um token de usuário do sistema'), h('p', { class: 'muted' }, 'Gere o token no Gerenciador de Negócios (Usuários do sistema) com as permissões listadas na documentação.'), tokenManual,
        h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => { const r = await api('POST', `/api/clinicas/${S.clinicaId}/meta/token`, { token: tokenManual.value, tipo: 'usuario_do_sistema' }); tokenManual.value = ''; aviso(`Conectado como ${r.usuario}.`, 'ok'); telaMeta(); }) }, 'Salvar token com segurança'))),
      S.meta.conectada ? h('div', { class: 'linha' }, h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => { const r = await api('GET', `/api/clinicas/${S.clinicaId}/meta/status`); aviso(r.permissoes.ok ? `Conectado como ${r.usuario}. Todas as permissões concedidas.` : `Faltam permissões: ${r.permissoes.faltando.join(', ')}`, r.permissoes.ok ? 'ok' : 'erro'); }) }, 'Verificar permissões'),
        h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(async () => { if (!confirm('Remover o acesso à Meta deste computador?')) return; const r = await api('DELETE', `/api/clinicas/${S.clinicaId}/meta`); aviso(r.aviso, 'ok'); telaMeta(); }) }, 'Desconectar')) : null),
    h('div', { class: 'card' }, h('h3', {}, '3. Conta de anúncios e página'),
      S.meta.ativos.adAccountId ? tabela({ 'Conta': `${S.meta.ativos.accountName || ''} (${S.meta.ativos.adAccountId})`, 'Fuso': S.meta.ativos.timezone, 'Moeda': S.meta.ativos.currency, 'Página': S.meta.ativos.pageId, 'Instagram': S.meta.ativos.instagramUserId || 'não vinculado' }) : h('p', { class: 'muted' }, 'Nenhuma conta selecionada.'),
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', disabled: !S.meta.conectada, onclick: () => seguro(async () => {
        const a = await api('GET', `/api/clinicas/${S.clinicaId}/meta/ativos`);
        const conta = h('select', {}, a.contas.map((c) => h('option', { value: c.id }, `${c.name} (${c.id}) ${c.account_status === 1 ? '' : '— inativa'}`)));
        const pagina = h('select', {}, a.paginas.map((p) => h('option', { value: p.id }, `${p.name}${p.instagram ? ' · @' + p.instagram.username : ' · sem Instagram'}`)));
        ativosBox.replaceChildren(h('label', {}, 'Conta de anúncios'), conta, h('label', {}, 'Página do Facebook'), pagina,
          h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => { await api('POST', `/api/clinicas/${S.clinicaId}/meta/selecionar`, { adAccountId: conta.value, pageId: pagina.value }); aviso('Conta e página salvas.', 'ok'); telaMeta(); }) }, 'Usar esta conta e página')));
      }) }, 'Escolher conta e página')), ativosBox),
    h('div', { class: 'card' }, h('h3', {}, '4. Conferir tudo pela API'),
      h('p', { class: 'muted' }, 'Verifica página, Instagram profissional, portfólio empresarial (BM), conta de anúncios ativa, forma de pagamento e WhatsApp ligado à página.'),
      h('div', { class: 'linha' },
        h('button', { class: 'btn', type: 'button', disabled: !S.meta.conectada, onclick: () => seguro(async () => { diagBox.replaceChildren(h('p', {}, 'Conferindo…')); diagBox.replaceChildren(diagnosticoBox(await api('GET', `/api/clinicas/${S.clinicaId}/meta/diagnostico`))); }) }, 'Conferir tudo'),
        h('button', { class: 'btn sec', type: 'button', onclick: () => seguro(telaPreparar) }, 'Passo a passo para criar o que falta')),
      diagBox),
    h('div', { class: 'linha' }, voltarInicio()));
}

// ---------- histórico, cadastro e sessão ----------
async function telaHistorico() {
  const [hist, sess] = await Promise.all([api('GET', `/api/clinicas/${S.clinicaId}/historico`), api('GET', `/api/clinicas/${S.clinicaId}/sessoes`)]);
  render(h('h1', {}, 'Histórico'),
    h('h2', {}, 'Resumos de sessão'),
    sess.length ? h('ul', { class: 'limpa' }, sess.map((s) => h('li', {}, h('strong', {}, new Date(s.criadoEm).toLocaleString('pt-BR')), ` — ${s.solicitacao}`, h('div', { class: 'muted' }, `Próximo passo: ${s.proximoPasso}`)))) : h('p', { class: 'muted' }, 'Nenhum resumo registrado.'),
    h('h2', {}, 'Registro de alterações'),
    h('ul', { class: 'limpa' }, hist.map((e) => h('li', {}, h('strong', {}, new Date(e.ts).toLocaleString('pt-BR')), ` — ${e.acao.replace(/_/g, ' ')}`, e.detalhes && Object.keys(e.detalhes).length ? h('div', { class: 'muted' }, JSON.stringify(e.detalhes).slice(0, 300)) : null))),
    h('div', { class: 'linha' }, voltarInicio()));
}

async function telaCadastro() {
  const forms = [['clinica', 'Clínica'], ['publico', 'Público'], ['campanha', 'Campanha'], ['criativo', 'Criativo'], ['atendimento', 'Atendimento']];
  const corpo = h('div', {});
  const abas = h('div', { class: 'abas' });
  const mostrar = async (form) => {
    [...abas.children].forEach((b) => b.classList.toggle('sel', b.dataset.f === form));
    const qs = await api('GET', `/api/perguntas/${form}`);
    corpo.replaceChildren(h('ul', { class: 'limpa' }, qs.map((q) => {
      const v = (S.clinica.respostas[form] || {})[q.id];
      return h('li', {}, h('strong', {}, q.texto), h('div', {}, v === undefined || v === '' ? h('span', { class: 'muted' }, 'sem resposta') : Array.isArray(v) ? v.join(', ') : String(v)),
        h('button', { class: 'link', type: 'button', onclick: () => seguro(() => perguntas('historico', () => telaCadastro(), q.ref)) }, 'Editar'));
    })));
  };
  for (const [f, t] of forms) abas.append(h('button', { class: 'aba', type: 'button', 'data-f': f, onclick: () => seguro(() => mostrar(f)) }, t));
  render(h('h1', {}, 'Cadastro da clínica'), h('p', { class: 'muted' }, 'Toda edição fica registrada no histórico (antes e depois).'), abas, corpo, h('div', { class: 'linha' }, voltarInicio()));
  await seguro(() => mostrar('clinica'));
}

function telaRegistrarSessao() {
  const t = S.retomada && S.retomada.tarefaEmAndamento;
  const f = { solicitacao: h('input', { type: 'text', placeholder: 'O que foi pedido hoje' }), objetivo: h('input', { type: 'text', value: t ? t.objetivo : '' }), decisoes: h('textarea', { placeholder: 'Decisões tomadas e por quê' }), acoesExecutadas: h('textarea', { placeholder: 'O que foi efetivamente feito' }), pendencias: h('textarea', { placeholder: 'O que ficou pendente' }), proximoPasso: h('input', { type: 'text', placeholder: 'Próximo passo' }) };
  render(h('h1', {}, 'Registrar resumo da sessão'), h('p', { class: 'muted' }, 'Fica salvo para continuar de onde parou na próxima vez.'),
    h('div', { class: 'card' }, ...Object.entries(f).map(([k, el]) => [h('label', {}, k.replace(/([A-Z])/g, ' $1')), el]),
      h('div', { class: 'linha' }, h('button', { class: 'btn', type: 'button', onclick: () => seguro(async () => {
        const body = Object.fromEntries(Object.entries(f).map(([k, el]) => [k, el.value]));
        await api('POST', `/api/clinicas/${S.clinicaId}/sessao`, body);
        aviso('Resumo salvo e conferido.', 'ok'); telaInicio();
      }) }, 'Salvar resumo'))), h('div', { class: 'linha' }, voltarInicio()));
}

// ---------- inicialização ----------
document.getElementById('btn-inicio').addEventListener('click', () => seguro(telaInicio));
document.getElementById('btn-trocar').addEventListener('click', () => { S.clinicaId = null; seguro(telaEscolherClinica); });

(async function iniciar() {
  await seguro(carregarEstado);
  const params = new URLSearchParams(location.search);
  let id = params.get('clinica');
  if (!id) { try { id = localStorage.getItem('m6d_clinica'); } catch (_) { id = null; } }
  if (params.get('conectado')) { aviso('Meta conectada com sucesso.', 'ok'); history.replaceState(null, '', '/'); }
  if (id && S.estado && S.estado.clinicas.some((c) => c.id === id)) { S.clinicaId = id; await seguro(params.get('conectado') ? telaMeta : telaInicio); }
  else await seguro(telaEscolherClinica);
})();
