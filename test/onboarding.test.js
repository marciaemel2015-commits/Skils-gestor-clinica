'use strict';
// Ponto de partida da Meta. Respostas da Meta são SIMULAÇÃO (mockFetch).
const test = require('node:test');
const assert = require('node:assert/strict');
const { setupEnv, mockFetch, TOKEN_FALSO } = require('./helpers');
setupEnv('onboarding');
const store = require('../app/lib/store');
const { missingFor } = require('../app/lib/questions');
const onboarding = require('../app/lib/onboarding');
const { MetaClient } = require('../app/lib/meta');

const PERMS = ['ads_management', 'ads_read', 'business_management', 'pages_show_list', 'pages_read_engagement', 'pages_manage_ads', 'instagram_basic'];

function contaSimulada({ pagamento = true, whatsapp = '+5519999990000', camposBloqueados = false, semIg = false, semConta = false } = {}) {
  return mockFetch([
    { match: (m, u) => /\/me\?/.test(u), reply: () => ({ body: { id: 'U1', name: 'Dona da Clínica' } }) },
    { match: (m, u) => u.includes('/me/permissions'), reply: () => ({ body: { data: PERMS.map((p) => ({ permission: p, status: 'granted' })) } }) },
    { match: (m, u) => u.includes('/me/accounts'), reply: () => ({ body: { data: [{ id: 'P1', name: 'Clínica Bella', instagram_business_account: semIg ? undefined : { id: 'IG1', username: 'clinicabella' } }] } }) },
    { match: (m, u) => u.includes('/me/adaccounts'), reply: () => ({ body: { data: semConta ? [] : [{ id: 'act_1', name: 'Conta Bella', account_status: 1 }] } }) },
    { match: (m, u) => u.includes('/me/businesses'), reply: () => ({ body: { data: [{ id: 'B1', name: 'BM Bella' }] } }) },
    { match: (m, u) => /\/act_1\?/.test(u) && u.includes('funding_source'), reply: () => (camposBloqueados ? { status: 400, body: { error: { message: 'no permission', code: 200 } } } : { body: pagamento ? { funding_source: '123', funding_source_details: { id: '123', display_string: 'Visa *1234' } } : {} }) },
    { match: (m, u) => /\/P1\?/.test(u) && u.includes('whatsapp_number'), reply: () => (camposBloqueados ? { status: 400, body: { error: { message: 'unknown field', code: 100 } } } : { body: whatsapp ? { whatsapp_number: whatsapp } : {} }) },
  ]);
}

test('quem já anuncia responde 1 pergunta e vai direto conectar', () => {
  const c = store.createClinica('Clínica Já Anuncia');
  assert.equal(missingFor('meta', store.getClinica(c.id).respostas)[0].ref, 'meta.ja_anuncia');
  store.saveAnswers(c.id, 'meta', { ja_anuncia: 'Sim' });
  assert.equal(missingFor('meta', store.getClinica(c.id).respostas).length, 0);
});

test('quem não tem tudo recebe passo a passo só do que falta, com link oficial', () => {
  const c = store.createClinica('Clínica Começando');
  store.saveAnswers(c.id, 'meta', { ja_anuncia: 'Não', tem_perfil_admin: 'Sim', tem_pagina: 'Sim', tem_instagram_profissional: 'Sim', tem_bm: 'Não', tem_conta_anuncios: 'Não', tem_pagamento: 'Não', whatsapp_conectado: 'Não sei' });
  const g = onboarding.guia(store.getClinica(c.id).respostas.meta);
  assert.equal(g.pronto, false);
  assert.deepEqual(g.faltam.map((f) => f.id), ['bm', 'conta_anuncios', 'pagamento', 'whatsapp']);
  for (const f of g.faltam) { assert.match(f.link, /^https:\/\/(business|www)\.facebook\.com\//); assert.ok(f.como.length >= 2); }
  assert.match(g.proximoPasso, /Portfólio empresarial/);
  assert.deepEqual(g.jaTem, ['Perfil pessoal no Facebook com acesso de administradora', 'Página do Facebook da clínica', 'Instagram profissional ligado à página']);
  store.saveAnswers(c.id, 'meta', { tem_bm: 'Sim', tem_conta_anuncios: 'Sim', tem_pagamento: 'Sim', whatsapp_conectado: 'Sim' });
  assert.equal(onboarding.guia(store.getClinica(c.id).respostas.meta).pronto, true);
});

test('conferência pela API (SIMULAÇÃO): conta completa fica pronta', async () => {
  const d = await onboarding.diagnosticar(new MetaClient({ token: TOKEN_FALSO, fetchImpl: contaSimulada() }));
  assert.equal(d.pronto, true, d.resumo);
  assert.ok(d.itens.every((i) => i.status === 'ok'), JSON.stringify(d.itens.map((i) => [i.id, i.status])));
  assert.match(d.itens.find((i) => i.id === 'pagamento').detalhe, /Visa \*1234/);
});

test('conferência pela API (SIMULAÇÃO): aponta pagamento, Instagram e conta faltando', async () => {
  const sem = await onboarding.diagnosticar(new MetaClient({ token: TOKEN_FALSO, fetchImpl: contaSimulada({ pagamento: false, whatsapp: null, semIg: true }) }));
  assert.equal(sem.pronto, false);
  const st = Object.fromEntries(sem.itens.map((i) => [i.id, i.status]));
  assert.equal(st.pagamento, 'falta'); assert.equal(st.whatsapp, 'falta'); assert.equal(st.instagram, 'falta');
  assert.ok(sem.itens.find((i) => i.id === 'pagamento').como.length, 'traz o passo a passo');
  const semConta = await onboarding.diagnosticar(new MetaClient({ token: TOKEN_FALSO, fetchImpl: contaSimulada({ semConta: true }) }));
  assert.equal(semConta.itens.find((i) => i.id === 'conta_anuncios').status, 'falta');
});

test('campo que a API não deixa ler vira "conferir", nunca "pronto"', async () => {
  const d = await onboarding.diagnosticar(new MetaClient({ token: TOKEN_FALSO, fetchImpl: contaSimulada({ camposBloqueados: true }) }));
  const st = Object.fromEntries(d.itens.map((i) => [i.id, i.status]));
  assert.equal(st.pagamento, 'verificar');
  assert.equal(st.whatsapp, 'verificar');
  assert.equal(d.pronto, true, 'nada comprovadamente faltando');
  assert.match(d.resumo, /Conferir manualmente/);
});
