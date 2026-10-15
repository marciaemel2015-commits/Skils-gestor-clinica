'use strict';
// Todas as respostas da Meta neste arquivo são SIMULAÇÃO (mockFetch). Nenhuma chamada real.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { setupEnv, mockFetch, TOKEN_FALSO, clinicaCompleta } = require('./helpers');
setupEnv('metaflow');
const store = require('../app/lib/store');
const flow = require('../app/lib/campaign-flow');
const { MetaClient, MetaError, buildAuthUrl, exchangeCode } = require('../app/lib/meta');
const log = require('../app/lib/logger');

const COPY = { titulo: 'Limpeza de pele em Campinas', textoPrincipal: 'Cada atendimento começa com uma conversa. Toque em enviar mensagem e fale com a nossa equipe.' };
const CRIATIVO = { imagemBase64: Buffer.from('imagem-simulada').toString('base64'), nomeArquivo: 'teste.jpg' };

function clinicaComMeta() {
  const id = clinicaCompleta(store, `Clínica Meta ${Math.random().toString(36).slice(2, 7)}`);
  store.updateClinicaMeta(id, { adAccountId: 'act_123', accountName: 'Conta Teste', pageId: '555', instagramUserId: '777', timezone: 'America/Sao_Paulo', currency: 'BRL' });
  return store.requireClinica(id);
}

// SIMULAÇÃO de uma conta saudável.
function rotasOk(overrides = {}) {
  let n = 0;
  return [
    { match: (m, u) => u.includes('/me/permissions'), reply: () => ({ body: { data: ['ads_management', 'ads_read', 'business_management', 'pages_show_list', 'pages_read_engagement', 'pages_manage_ads', 'instagram_basic'].map((p) => ({ permission: p, status: 'granted' })) } }) },
    { match: (m, u) => m === 'GET' && /\/act_123\?/.test(u), reply: () => ({ body: { id: 'act_123', account_status: 1, timezone_name: 'America/Sao_Paulo', currency: 'BRL' } }) },
    { match: (m, u) => m === 'POST' && u.endsWith('/act_123/campaigns'), reply: (m, u, b) => (b.execution_options ? { body: { success: true } } : { body: { id: 'CAMP1' } }) },
    { match: (m, u) => m === 'POST' && u.endsWith('/act_123/adimages'), reply: () => ({ body: { images: { 'teste.jpg': { hash: 'HASH1' } } } }) },
    { match: (m, u) => m === 'POST' && u.endsWith('/act_123/adsets'), reply: (m, u, b) => (overrides.adsetErro && !b.execution_options ? { status: 400, body: { error: { message: 'Invalid parameter', code: 100, error_user_msg: 'Orçamento abaixo do mínimo.' } } } : b.execution_options ? { body: { success: true } } : { body: { id: 'ADSET1' } }) },
    { match: (m, u) => m === 'POST' && u.endsWith('/act_123/adcreatives'), reply: () => ({ body: { id: 'CR1' } }) },
    { match: (m, u) => m === 'POST' && u.endsWith('/act_123/ads'), reply: () => ({ body: { id: 'AD1' } }) },
    { match: (m, u) => m === 'POST' && u.endsWith('/CAMP1'), reply: () => { n++; return { body: { success: true } }; } },
    { match: (m, u) => m === 'GET' && u.includes('/AD1?'), reply: () => ({ body: { id: 'AD1', effective_status: overrides.status || 'PENDING_REVIEW' } }) },
  ];
}

test('plano: pendências reais quando faltam Meta, criativo e texto', () => {
  const id = clinicaCompleta(store, 'Clínica Sem Meta');
  const plan = flow.buildPlan({ clinica: store.requireClinica(id), objetivo: 'whatsapp', copy: null, criativo: null });
  assert.equal(plan.podePublicar, false);
  const t = plan.pendencias.join(' | ');
  for (const k of ['Conta de anúncios', 'Página do Facebook', 'Fuso horário', 'Texto do anúncio', 'Criativo']) assert.match(t, new RegExp(k));
});

test('plano: segmentação local, idade, orçamento em centavos e início 00:00 no fuso da conta', () => {
  const c = clinicaComMeta();
  const plan = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO, now: new Date('2026-10-14T15:00:00Z') });
  assert.equal(plan.podePublicar, true, plan.pendencias.join(' | '));
  const { campaign, adset, creative } = plan.specs;
  assert.equal(campaign.objective, 'OUTCOME_ENGAGEMENT');
  assert.equal(campaign.status, 'PAUSED');
  assert.deepEqual(campaign.special_ad_categories, []);
  assert.equal(adset.destination_type, 'WHATSAPP');
  assert.equal(adset.optimization_goal, 'CONVERSATIONS');
  assert.equal(adset.daily_budget, 3000);
  assert.deepEqual(adset.targeting.geo_locations.custom_locations[0], { latitude: -22.8936, longitude: -47.0533, radius: 8, distance_unit: 'kilometer' });
  assert.equal(adset.targeting.age_min, 25); assert.equal(adset.targeting.age_max, 55);
  assert.deepEqual(adset.targeting.genders, [2]);
  assert.equal(adset.start_time, '2026-10-15T00:00:00-03:00');
  assert.equal(adset.promoted_object.whatsapp_phone_number, '+5519999990000');
  assert.equal(creative.object_story_spec.link_data.call_to_action.type, 'WHATSAPP_MESSAGE');
  assert.match(plan.resumo['Início'], /15\/10\/2026 às 00:00 \(America\/Sao_Paulo\)/);
});

test('plano WhatsApp: 3 botões fixos (ice breakers) como gatilhos do CRM, no formato oficial', () => {
  const c = clinicaComMeta();
  const p1 = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  const pwm = p1.specs.creative.object_story_spec.link_data.page_welcome_message;
  assert.equal(pwm.landing_screen_type, 'welcome_message');
  assert.equal(pwm.text_format.customer_action_type, 'ice_breakers');
  assert.deepEqual(pwm.text_format.message.ice_breakers.map((b) => b.title), ['Quero agendar minha avaliação', 'Como funciona a avaliação?', 'Quero saber mais sobre o procedimento']);
  assert.match(p1.resumo['Botões do WhatsApp (gatilhos do CRM)'], /cadastre cada frase como gatilho/);
  // A clínica que escolheu "Consulta" recebe os botões com essa palavra.
  store.saveAnswers(c.id, 'atendimento', { nome_atendimento: 'Consulta' });
  const pc = flow.buildPlan({ clinica: store.requireClinica(c.id), objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  assert.deepEqual(pc.botoes, ['Quero agendar minha consulta', 'Como funciona a consulta?', 'Quero saber mais sobre o procedimento']);
  // Botões editados, validados e com triagem.
  const p2 = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: { ...COPY, botoes: ['Quero agendar', 'Quero agendar'] }, criativo: CRIATIVO });
  assert.ok(p2.pendencias.some((x) => /diferentes/.test(x)));
  const p3 = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: { ...COPY, botoes: ['a', 'b', 'c', 'd', 'e'] }, criativo: CRIATIVO });
  assert.ok(p3.pendencias.some((x) => /1 a 4/.test(x)));
  const proibida = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: { ...COPY, botoes: ['Quero o resultado garantido'] }, criativo: CRIATIVO });
  assert.equal(proibida.conformidade.status, 'bloqueado', 'os botões também passam pela triagem');
  // Alternativa: mensagem já digitada (autofill), quando não há botões.
  const pa = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: { ...COPY, mensagemInicial: 'Quero minha avaliação' }, criativo: CRIATIVO });
  assert.equal(pa.specs.creative.object_story_spec.link_data.page_welcome_message.text_format.customer_action_type, 'autofill_message');
  assert.equal(pa.botoes, null);
  const seg = flow.buildPlan({ clinica: c, objetivo: 'seguidores', copy: COPY, criativo: CRIATIVO });
  assert.equal(seg.botoes, null, 'só existe em campanha de WhatsApp');
});

test('plano: orçamento acima do limite mensal é pendência', () => {
  const c = clinicaComMeta();
  store.saveAnswers(c.id, 'campanha', { orcamento_diario: '50' });
  const plan = flow.buildPlan({ clinica: store.requireClinica(c.id), objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  assert.ok(plan.pendencias.some((p) => /acima do limite mensal/.test(p)));
});

test('plano: copy com promessa bloqueia publicação', () => {
  const c = clinicaComMeta();
  const plan = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: { titulo: 'X', textoPrincipal: 'Resultado garantido e sem dor' }, criativo: CRIATIVO });
  assert.equal(plan.podePublicar, false);
  assert.equal(plan.conformidade.status, 'bloqueado');
});

test('plano: seguidores usa destino perfil do Instagram (PROFILE_VISIT) e reconhecimento usa alcance', () => {
  const c = clinicaComMeta();
  const s = flow.buildPlan({ clinica: c, objetivo: 'seguidores', copy: COPY, criativo: CRIATIVO });
  assert.equal(s.specs.campaign.objective, 'OUTCOME_TRAFFIC');
  assert.equal(s.specs.adset.destination_type, 'INSTAGRAM_PROFILE');
  assert.equal(s.specs.adset.optimization_goal, 'PROFILE_VISIT');
  assert.ok(s.observacao, 'avisa disponibilidade limitada na API');
  const r = flow.buildPlan({ clinica: c, objetivo: 'reconhecimento', copy: COPY, criativo: { instagramMediaId: '1789' } });
  assert.equal(r.specs.campaign.objective, 'OUTCOME_AWARENESS');
  assert.equal(r.specs.adset.optimization_goal, 'REACH');
  assert.equal(r.specs.creative.source_instagram_media_id, '1789');
});

test('publicação exige confirmação explícita', async () => {
  const c = clinicaComMeta();
  const plan = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  const calls = [];
  const client = new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch(rotasOk(), calls) });
  await assert.rejects(flow.publish({ client, plan, clinica: c, confirmacao: undefined, criativo: CRIATIVO }), /confirmação explícita/);
  await assert.rejects(flow.publish({ client, plan, clinica: c, confirmacao: 'sim', criativo: CRIATIVO }), /confirmação explícita/);
  assert.equal(calls.length, 0, 'nenhuma chamada à Meta sem confirmação');
});

test('publicação (SIMULAÇÃO): valida antes, cria pausada, ativa por último e registra status real', async () => {
  const c = clinicaComMeta();
  const plan = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  const calls = []; const etapas = [];
  const client = new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch(rotasOk(), calls) });
  const r = await flow.publish({ client, plan, clinica: c, confirmacao: true, criativo: CRIATIVO, onStep: (s) => etapas.push(s.passo) });
  assert.deepEqual(r.ids, { campaignId: 'CAMP1', imageHash: 'HASH1', adsetId: 'ADSET1', creativeId: 'CR1', adId: 'AD1' });
  assert.equal(r.estado, 'em_revisao');
  const posts = calls.filter((x) => x.method === 'POST');
  assert.ok(JSON.parse(posts[0].body.execution_options).includes('validate_only'), 'primeira escrita é validação');
  assert.equal(posts[1].body.status, 'PAUSED', 'campanha criada pausada');
  assert.equal(posts[posts.length - 1].body.status, 'ACTIVE', 'ativação é a última escrita');
  assert.deepEqual(etapas, ['verificar_permissoes', 'verificar_conta', 'validar_campanha', 'criar_campanha_pausada', 'enviar_imagem', 'validar_conjunto', 'criar_conjunto', 'criar_criativo', 'criar_anuncio', 'ativar_campanha', 'consultar_status']);
  assert.ok(r.proximoMonitoramento);
});

test('estado programada quando aprovada antes do início', async () => {
  const c = clinicaComMeta();
  const plan = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  const client = new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch(rotasOk({ status: 'ACTIVE' })) });
  const r = await flow.publish({ client, plan, clinica: c, confirmacao: true, criativo: CRIATIVO });
  assert.equal(r.estado, 'programada');
  assert.equal(flow.mapEstado('DISAPPROVED'), 'reprovada');
  assert.equal(flow.mapEstado('WITH_ISSUES'), 'com_erro');
  assert.equal(flow.mapEstado('ACTIVE', 1), 'ativa');
});

test('falha da API no meio: campanha fica pausada, erro explicado e ids registrados', async () => {
  const c = clinicaComMeta();
  const plan = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  const calls = [];
  const client = new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch(rotasOk({ adsetErro: true }), calls) });
  await assert.rejects(flow.publish({ client, plan, clinica: c, confirmacao: true, criativo: CRIATIVO }), (e) => {
    assert.equal(e.ids.campaignId, 'CAMP1');
    assert.match(e.message, /criar_conjunto/);
    assert.match(e.message, /Orçamento abaixo do mínimo/);
    return true;
  });
  assert.ok(!calls.some((x) => x.method === 'POST' && x.url.endsWith('/CAMP1')), 'campanha nunca foi ativada');
});

test('falha de permissão e conta inativa interrompem antes de criar', async () => {
  const c = clinicaComMeta();
  const plan = flow.buildPlan({ clinica: c, objetivo: 'whatsapp', copy: COPY, criativo: CRIATIVO });
  const semPerm = [{ match: (m, u) => u.includes('/me/permissions'), reply: () => ({ body: { data: [{ permission: 'ads_read', status: 'granted' }] } }) }];
  const calls = [];
  await assert.rejects(flow.publish({ client: new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch(semPerm, calls) }), plan, clinica: c, confirmacao: true, criativo: CRIATIVO }), /ads_management/);
  assert.equal(calls.filter((x) => x.method === 'POST').length, 0);
  const inativa = rotasOk(); inativa[1] = { match: (m, u) => m === 'GET' && /\/act_123\?/.test(u), reply: () => ({ body: { account_status: 2 } }) };
  await assert.rejects(flow.publish({ client: new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch(inativa) }), plan, clinica: c, confirmacao: true, criativo: CRIATIVO }), /não está ativa/);
});

test('erros da Meta traduzidos (token expirado, limite, rede)', async () => {
  const exp = new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch([{ match: () => true, reply: () => ({ status: 401, body: { error: { message: 'Error validating access token', code: 190 } } }) }]) });
  await assert.rejects(exp.me(), (e) => e instanceof MetaError && /Conecte a Meta novamente/.test(e.explicacao));
  const lim = new MetaClient({ token: TOKEN_FALSO, fetchImpl: mockFetch([{ match: () => true, reply: () => ({ status: 400, body: { error: { message: 'limit', code: 17 } } }) }]) });
  await assert.rejects(lim.me(), (e) => /Limite de chamadas/.test(e.explicacao));
  const rede = new MetaClient({ token: TOKEN_FALSO, fetchImpl: async () => { throw new Error(`ECONNRESET ao enviar access_token=${TOKEN_FALSO}`); } });
  await assert.rejects(rede.me(), (e) => e.rede && !e.message.includes(TOKEN_FALSO) && /sem internet/.test(e.explicacao));
});

test('OAuth: URL correta e troca por token de longa duração (SIMULAÇÃO)', async () => {
  const u = new URL(buildAuthUrl({ appId: '123456', redirectUri: 'http://localhost:4766/auth/meta/callback', state: 'abc' }));
  assert.equal(u.searchParams.get('client_id'), '123456');
  assert.match(u.searchParams.get('scope'), /ads_management/);
  assert.equal(u.searchParams.get('state'), 'abc');
  const calls = [];
  const f = mockFetch([
    { match: (m, url) => url.includes('code=CODE'), reply: () => ({ body: { access_token: 'EAAcurto' + 'y'.repeat(30) } }) },
    { match: (m, url) => url.includes('fb_exchange_token'), reply: () => ({ body: { access_token: TOKEN_FALSO, expires_in: 5184000 } }) },
  ], calls);
  const r = await exchangeCode({ appId: '123456', appSecret: 'segredo-de-teste-123456', redirectUri: 'http://localhost/cb', code: 'CODE', fetchImpl: f });
  assert.equal(r.token, TOKEN_FALSO); assert.equal(r.expiresIn, 5184000);
});

test('appsecret_proof é enviado quando há chave do app', async () => {
  const calls = [];
  const client = new MetaClient({ token: TOKEN_FALSO, appSecret: 'segredo', fetchImpl: mockFetch([{ match: () => true, reply: () => ({ body: { id: '1', name: 'X' } }) }], calls) });
  await client.me();
  assert.match(calls[0].url, /appsecret_proof=[0-9a-f]{64}/);
});

test('logs nunca contêm tokens', () => {
  log.error('falha com token', { url: `https://graph.facebook.com/v26.0/me?access_token=${TOKEN_FALSO}`, access_token: TOKEN_FALSO, msg: `Bearer ${TOKEN_FALSO}` });
  const dir = process.env.M6D_LOG_DIR;
  const txt = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  assert.ok(txt.includes('falha com token'));
  assert.ok(!txt.includes(TOKEN_FALSO));
});
