'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { setupEnv, TOKEN_FALSO, clinicaCompleta } = require('./helpers');
setupEnv('secrets');
const secrets = require('../app/lib/secrets');
const store = require('../app/lib/store');
const gen = require('../app/lib/generators');

function arquivosDe(dir) {
  const out = [];
  const walk = (d) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); fs.statSync(p).isDirectory() ? walk(p) : out.push(p); } };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

test('cofre AES: grava cifrado, lê de volta, nunca em texto puro', () => {
  const r = secrets.saveSecret('clinica-x', 'meta_token', TOKEN_FALSO, { tipo: 'teste' });
  assert.ok(r.ok);
  assert.equal(secrets.getSecret('clinica-x', 'meta_token'), TOKEN_FALSO);
  for (const f of arquivosDe(process.env.M6D_SECRETS_DIR)) assert.ok(!fs.readFileSync(f, 'utf8').includes(TOKEN_FALSO), `texto puro em ${f}`);
  assert.equal(secrets.secretInfo('clinica-x', 'meta_token').existe, true);
  assert.ok(!JSON.stringify(secrets.secretInfo('clinica-x', 'meta_token')).includes(TOKEN_FALSO), 'info não expõe o valor');
  secrets.deleteSecret('clinica-x', 'meta_token');
  assert.equal(secrets.getSecret('clinica-x', 'meta_token'), null);
});

test('cofre: sem chave segura, recusa gravar', () => {
  const k = process.env.M6D_SECRET_KEY;
  delete process.env.M6D_SECRET_KEY;
  assert.throws(() => secrets.saveSecret('clinica-y', 'meta_token', TOKEN_FALSO), /Armazenamento seguro indisponível/);
  process.env.M6D_SECRET_KEY = k;
  assert.throws(() => secrets.saveSecret('../fora', 'x', 'v'), /inválido/);
});

test('cofre DPAPI do Windows (real, sem simulação)', { skip: process.platform !== 'win32' && 'somente Windows' }, () => {
  process.env.M6D_SECRET_BACKEND = 'dpapi';
  try {
    secrets.saveSecret('clinica-dpapi', 'meta_token', TOKEN_FALSO);
    assert.equal(secrets.getSecret('clinica-dpapi', 'meta_token'), TOKEN_FALSO);
    const raw = fs.readFileSync(path.join(process.env.M6D_SECRETS_DIR, 'clinica-dpapi', 'meta_token.json'), 'utf8');
    assert.ok(!raw.includes(TOKEN_FALSO));
    assert.equal(JSON.parse(raw).backend, 'dpapi');
  } finally { process.env.M6D_SECRET_BACKEND = 'aes'; }
});

test('copies: usam dados reais, não inventam e passam na triagem', () => {
  const id = clinicaCompleta(store, 'Clínica Copy');
  const c = store.requireClinica(id);
  const v = gen.copies(c, 'whatsapp');
  assert.equal(v.length, 4);
  for (const x of v) {
    assert.match(x.textoPrincipal, /Clínica Copy/);
    assert.match(x.textoPrincipal, /enviar mensagem/i);
    assert.notEqual(x.conformidade.status, 'bloqueado', `${x.angulo}: ${JSON.stringify(x.conformidade.itens)}`);
  }
  const vazio = gen.copies(store.createClinica('Clínica Vazia'), 'whatsapp');
  assert.ok(vazio.some((x) => x.textoPrincipal.includes('[A CONFIRMAR]')), 'dado ausente fica marcado');
});

test('criativo estático e vídeo: prompt completo e roteiro com todas as partes', () => {
  const c = store.requireClinica(clinicaCompleta(store, 'Clínica Criativo'));
  const p = gen.promptEstatico(c);
  for (const k of ['formato', 'Composição', 'Paleta', 'Iluminação', 'Tipografia', 'Texto na imagem', 'Proibido', 'Hierarquia']) assert.match(p.prompt, new RegExp(k));
  const v = gen.roteiroVideo(c);
  assert.equal(v.cenas[0].tempo, '0–3s');
  assert.ok(v.gravacao.length && v.edicao.length && v.cta);
});

test('scripts de WhatsApp: dúvida clínica só com resposta aprovada', () => {
  const id = clinicaCompleta(store, 'Clínica Script');
  let s = gen.scriptsWhatsapp(store.requireClinica(id));
  assert.match(s.scripts.duvidasClinicas, /Ainda não há respostas aprovadas/);
  store.saveAnswers(id, 'clinica', { informacoes_validadas: 'Sim, já validou' });
  store.saveAnswers(id, 'atendimento', { respostas_validadas: 'Usamos anestésico tópico conforme avaliação.' });
  s = gen.scriptsWhatsapp(store.requireClinica(id));
  assert.match(s.scripts.duvidasClinicas, /anestésico tópico/);
  assert.ok(s.objeções.find((o) => o.objecao === 'Preço'));
});

test('nomes de método: pelo menos 10, todos os campos e ressalvas', () => {
  const c = store.requireClinica(clinicaCompleta(store, 'Clínica Nomes'));
  const n = gen.nomesMetodo(c, { procedimento: 'Limpeza de pele', diferencial: 'Atendimento prático de 40 minutos', duracao: '40 minutos' });
  assert.ok(n.length >= 10);
  for (const x of n) for (const k of ['nome', 'conceito', 'beneficioComunicado', 'diferencialReal', 'headline', 'copy', 'ideiaCriativo', 'roteiro', 'cta', 'faq', 'limitacoes']) assert.ok(x[k], `${x.nome} sem ${k}`);
  assert.ok(n.some((x) => /Express/.test(x.nome)), 'praticidade real gera nome "Express"');
  assert.match(n[0].limitacoes, /INPI/);
});

test('treinamento: avaliação pontua e gera plano de melhoria', () => {
  const t = gen.treinamento(store.requireClinica(clinicaCompleta(store, 'Clínica Treino')));
  assert.ok(t.simulacoes.length >= 2);
  const notas = Object.fromEntries(t.criterios.map((c) => [c.criterio, 2]));
  assert.equal(gen.avaliarSimulacao(notas).percentual, 100);
  notas['Segurança da informação'] = 0;
  const r = gen.avaliarSimulacao(notas);
  assert.ok(r.percentual < 100 && r.planoMelhoria[0].startsWith('Segurança'));
  assert.throws(() => gen.avaliarSimulacao({ ...notas, Acolhimento: 5 }), /Nota inválida/);
});
