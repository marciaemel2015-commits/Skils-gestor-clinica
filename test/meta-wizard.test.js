'use strict';
// Assistente de configuração da Meta via HTTP: Caminho 1, Caminho 2, isolamento e falhas.
// Todas as respostas "da Meta" são SIMULAÇÃO (fetch simulado).
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { setupEnv, TOKEN_FALSO } = require('./helpers');
setupEnv('wizard');
const store = require('../app/lib/store');
const secrets = require('../app/lib/secrets');
const onboarding = require('../app/lib/onboarding');
const { createApp } = require('../app/server');

const PERMS = ['ads_management', 'ads_read', 'business_management', 'pages_show_list', 'pages_read_engagement', 'pages_manage_ads', 'instagram_basic'];
const resp = (body, status = 200) => ({ ok: status < 400, status, json: async () => body, headers: { get: () => null } });

// SIMULAÇÃO de uma conta completa.
function contaCompleta({ perms = PERMS.map((p) => ({ permission: p, status: 'granted' })) } = {}) {
  return async (url) => {
    const u = String(url);
    if (/\/me\?/.test(u)) return resp({ id: 'U1', name: 'Dona da Clínica' });
    if (u.includes('/me/permissions')) return resp({ data: perms });
    if (u.includes('/me/accounts')) return resp({ data: [{ id: 'P1', name: 'Clínica Bella', instagram_business_account: { id: 'IG1', username: 'clinicabella' } }] });
    if (u.includes('/me/adaccounts')) return resp({ data: [{ id: 'act_1', name: 'Conta Bella', account_status: 1, timezone_name: 'America/Sao_Paulo', currency: 'BRL' }] });
    if (u.includes('/me/businesses')) return resp({ data: [{ id: 'B1', name: 'BM Bella' }] });
    if (/\/act_1\?/.test(u)) return resp({ funding_source: '9', funding_source_details: { id: '9', display_string: 'Visa *1234' } });
    if (/\/P1\?/.test(u)) return resp({ whatsapp_number: '+5519999990000' });
    return resp({ error: { message: `SIMULAÇÃO: rota não simulada ${u}`, code: 100 } }, 400);
  };
}

let fetchAtual = contaCompleta();
const PORT = 48000 + Math.floor(Math.random() * 900);
const app = createApp({ fetchImpl: (...a) => fetchAtual(...a), port: PORT });

function req(method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ host: '127.0.0.1', port: PORT, method, path: url, headers: { Host: `127.0.0.1:${PORT}`, 'Content-Type': 'application/json', 'X-6D-Token': app.sessionToken, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) } }, (res) => {
      let t = ''; res.on('data', (c) => { t += c; }); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(t) }));
    });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}

test.before(() => new Promise((r) => app.server.listen(PORT, '127.0.0.1', r)));
test.after(() => new Promise((r) => app.server.close(r)));

test('status da conta traduzido (o que a API permite verificar)', () => {
  assert.equal(onboarding.statusConta({ account_status: 1 }).texto, 'ativa');
  assert.equal(onboarding.statusConta({ account_status: 3 }).ativa, false);
  assert.match(onboarding.statusConta({ account_status: 3 }).texto, /pagamento/);
});

test('Caminho 1: já anuncia → 1 pergunta → conectar → conferir tudo e registrar', async () => {
  fetchAtual = contaCompleta();
  const c = (await req('POST', '/api/clinicas', { nome: 'Clínica Caminho Um' })).body;
  const p = (await req('GET', `/api/clinicas/${c.id}/proximas/meta`)).body;
  assert.equal(p.faltam.length, 1);
  assert.equal(p.faltam[0].ref, 'meta.ja_anuncia');
  await req('POST', `/api/clinicas/${c.id}/respostas`, { form: 'meta', respostas: { ja_anuncia: 'Sim' } });
  assert.equal((await req('GET', `/api/clinicas/${c.id}/proximas/meta`)).body.faltam.length, 0, 'resposta persistida');
  assert.equal((await req('GET', `/api/clinicas/${c.id}/meta/diagnostico`)).status, 409, 'sem conexão: não inventa resultado');
  assert.equal((await req('POST', `/api/clinicas/${c.id}/meta/token`, { token: TOKEN_FALSO })).status, 200);
  const d = await req('GET', `/api/clinicas/${c.id}/meta/diagnostico`);
  assert.equal(d.status, 200);
  assert.equal(d.body.pronto, true, d.body.resumo);
  const ids = d.body.itens.map((i) => i.id);
  for (const k of ['perfil', 'permissoes', 'pagina', 'instagram', 'bm', 'conta_anuncios', 'pagamento', 'whatsapp']) assert.ok(ids.includes(k), `item ${k}`);
  const contas = d.body.itens.find((i) => i.id === 'conta_anuncios');
  assert.match(contas.detalhe, /ativa, fuso America\/Sao_Paulo, BRL/);
  const pag = d.body.itens.find((i) => i.id === 'pagamento');
  assert.match(pag.detalhe, /Central de Cobrança/, 'orienta confirmar no painel oficial');
  assert.equal(pag.link, 'https://business.facebook.com/billing_hub/');
  assert.ok(store.readAudit(c.id).some((a) => a.acao === 'meta_diagnostico'), 'conferência registrada');
});

test('Caminho 2: uma pergunta por vez, passo a passo só do que falta, etapa concluída sai da lista', async () => {
  const c = (await req('POST', '/api/clinicas', { nome: 'Clínica Caminho Dois' })).body;
  await req('POST', `/api/clinicas/${c.id}/respostas`, { form: 'meta', respostas: { ja_anuncia: 'Não' } });
  let p = (await req('GET', `/api/clinicas/${c.id}/proximas/meta_ativos`)).body;
  assert.equal(p.faltam[0].ref, 'meta.tem_perfil_admin', 'começa por perfil e acesso de administradora');
  const ordem = [];
  for (const r of ['Sim', 'Não', 'Não', 'Não', 'Não', 'Não', 'Não sei']) {
    p = (await req('GET', `/api/clinicas/${c.id}/proximas/meta_ativos`)).body;
    ordem.push(p.faltam[0].ref);
    const [form, id] = p.faltam[0].ref.split('.');
    assert.equal((await req('POST', `/api/clinicas/${c.id}/respostas`, { form, respostas: { [id]: r } })).body.ok, true);
  }
  assert.equal(new Set(ordem).size, 7, 'nenhuma pergunta repetida');
  assert.equal((await req('GET', `/api/clinicas/${c.id}/proximas/meta_ativos`)).body.faltam.length, 0);
  let g = (await req('GET', `/api/clinicas/${c.id}/meta/guia`)).body;
  assert.deepEqual(g.faltam.map((f) => f.id), ['pagina', 'instagram', 'bm', 'conta_anuncios', 'pagamento', 'whatsapp']);
  assert.ok(g.faltam.every((f) => f.link.startsWith('https://') && f.como.length >= 2));
  await req('POST', `/api/clinicas/${c.id}/respostas`, { form: 'meta', respostas: { tem_pagina: 'Sim' } });
  g = (await req('GET', `/api/clinicas/${c.id}/meta/guia`)).body;
  assert.equal(g.faltam[0].id, 'instagram');
});

test('isolamento: respostas e conexão de uma clínica não aparecem em outra', async () => {
  const a = (await req('POST', '/api/clinicas', { nome: 'Clínica Iso A' })).body;
  const b = (await req('POST', '/api/clinicas', { nome: 'Clínica Iso B' })).body;
  await req('POST', `/api/clinicas/${a.id}/respostas`, { form: 'meta', respostas: { tem_pagina: 'Sim' } });
  secrets.saveSecret(a.id, 'meta_token', TOKEN_FALSO);
  assert.ok((await req('GET', `/api/clinicas/${b.id}/meta/guia`)).body.faltam.some((f) => f.id === 'pagina'));
  assert.equal((await req('GET', `/api/clinicas/${b.id}`)).body.meta.conectada, false);
  assert.equal((await req('GET', `/api/clinicas/${b.id}/meta/diagnostico`)).status, 409);
});

test('Meta recusa permissão: aparece como falta, com a permissão recusada', async () => {
  const c = (await req('POST', '/api/clinicas', { nome: 'Clínica Sem Permissão' })).body;
  secrets.saveSecret(c.id, 'meta_token', TOKEN_FALSO);
  fetchAtual = contaCompleta({ perms: [{ permission: 'ads_read', status: 'granted' }, { permission: 'ads_management', status: 'declined' }] });
  const d = (await req('GET', `/api/clinicas/${c.id}/meta/diagnostico`)).body;
  const perm = d.itens.find((i) => i.id === 'permissoes');
  assert.equal(perm.status, 'falta');
  assert.match(perm.detalhe, /recusadas: ads_management/);
  assert.equal(d.pronto, false);
});

test('API falha (token expirado / sem internet): erro explicado, nada registrado como conferido', async () => {
  const c = (await req('POST', '/api/clinicas', { nome: 'Clínica Falha API' })).body;
  secrets.saveSecret(c.id, 'meta_token', TOKEN_FALSO);
  fetchAtual = async () => resp({ error: { message: 'Error validating access token', code: 190 } }, 401);
  const r1 = await req('GET', `/api/clinicas/${c.id}/meta/diagnostico`);
  assert.equal(r1.status, 502);
  assert.match(r1.body.erro, /Conecte a Meta novamente/);
  fetchAtual = async () => { throw new Error('ECONNRESET'); };
  const r2 = await req('GET', `/api/clinicas/${c.id}/meta/diagnostico`);
  assert.equal(r2.status, 502);
  assert.match(r2.body.erro, /sem internet/);
  assert.ok(!store.readAudit(c.id).some((a) => a.acao === 'meta_diagnostico'));
});

test('lista parcial: se uma consulta falhar, o item fica "conferir" e os demais seguem', async () => {
  const c = (await req('POST', '/api/clinicas', { nome: 'Clínica Parcial' })).body;
  secrets.saveSecret(c.id, 'meta_token', TOKEN_FALSO);
  const base = contaCompleta();
  fetchAtual = async (url, o) => (String(url).includes('/me/businesses') ? resp({ error: { message: 'no permission', code: 200 } }, 403) : base(url, o));
  const d = (await req('GET', `/api/clinicas/${c.id}/meta/diagnostico`)).body;
  assert.equal(d.itens.find((i) => i.id === 'bm').status, 'verificar');
  assert.equal(d.itens.find((i) => i.id === 'pagina').status, 'ok');
});
