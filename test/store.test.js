'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { setupEnv, clinicaCompleta } = require('./helpers');

setupEnv('store');
const store = require('../app/lib/store');
const { missingFor } = require('../app/lib/questions');

test('cadastro de clínica grava e confirma', () => {
  const c = store.createClinica('Clínica Bella Pele');
  assert.equal(c.id, 'clinica-bella-pele');
  assert.ok(c._gravacao.ok);
  assert.equal(store.getClinica(c.id).respostas.clinica.nome_comercial, 'Clínica Bella Pele');
  const c2 = store.createClinica('Clínica Bella Pele');
  assert.equal(c2.id, 'clinica-bella-pele-2', 'nomes iguais geram ids distintos');
});

test('questionário: valida, normaliza e registra antes/depois no histórico', () => {
  const c = store.createClinica('Clínica Questionário');
  const bad = store.saveAnswers(c.id, 'clinica', { whatsapp: '123', orcamento_diario: 'abc', raio_km: '999' });
  assert.equal(bad.ok, false);
  assert.ok(bad.erros.whatsapp && bad.erros.orcamento_diario && bad.erros.raio_km);
  const ok = store.saveAnswers(c.id, 'clinica', { whatsapp: '(11) 98888-7777', orcamento_diario: '45,50', procedimentos: 'A, B , C' });
  assert.equal(ok.ok, true);
  const r = store.getClinica(c.id).respostas.clinica;
  assert.equal(r.orcamento_diario, 45.5);
  assert.deepEqual(r.procedimentos, ['A', 'B', 'C']);
  store.saveAnswers(c.id, 'clinica', { orcamento_diario: '60' });
  const mud = store.readAudit(c.id).filter((a) => a.acao === 'respostas_atualizadas').pop();
  assert.deepEqual(mud.detalhes.mudancas[0], { campo: 'clinica.orcamento_diario', antes: 45.5, depois: 60 });
});

test('não repete perguntas já respondidas e recupera contexto após reinício', () => {
  const id = clinicaCompleta(store, 'Clínica Persistência');
  assert.equal(missingFor('whatsapp', store.getClinica(id).respostas).length, 0, 'todas as perguntas do WhatsApp já respondidas');
  // "Reinício": descarta os módulos carregados e relê do disco.
  for (const k of Object.keys(require.cache)) if (k.includes(`${path.sep}app${path.sep}`)) delete require.cache[k];
  const store2 = require('../app/lib/store');
  const q2 = require('../app/lib/questions');
  assert.equal(q2.missingFor('whatsapp', store2.getClinica(id).respostas).length, 0);
  assert.equal(store2.getClinica(id).respostas.publico.idade_min, '25');
});

test('perguntas faltantes aparecem na ordem e somem quando respondidas', () => {
  const c = store.createClinica('Clínica Ordem');
  const f1 = missingFor('seguidores', store.getClinica(c.id).respostas);
  assert.equal(f1[0].ref, 'clinica.cidade_uf', 'nome já veio do cadastro, próxima é cidade');
  store.saveAnswers(c.id, 'clinica', { cidade_uf: 'Recife/PE' });
  const f2 = missingFor('seguidores', store.getClinica(c.id).respostas);
  assert.equal(f2.length, f1.length - 1);
  assert.ok(!f2.find((q) => q.ref === 'clinica.cidade_uf'));
});

test('isolamento: registros de uma clínica não são acessíveis por outra', () => {
  const a = store.createClinica('Clínica Alfa');
  const b = store.createClinica('Clínica Beta');
  const cp = store.createEntity('campanhas', a.id, { nome: 'Campanha Alfa', estado: 'rascunho' });
  assert.equal(store.getEntity('campanhas', b.id, cp.id), null, 'outra clínica não encontra');
  assert.equal(store.listEntities('campanhas', b.id).length, 0);
  // Mesmo copiando o arquivo para a pasta da outra clínica, a leitura é bloqueada.
  const src = path.join(store.dataDir(), 'campanhas', a.id, `${cp.id}.json`);
  const dst = path.join(store.dataDir(), 'campanhas', b.id, `${cp.id}.json`);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  assert.throws(() => store.getEntity('campanhas', b.id, cp.id), /outra clínica/);
  assert.equal(store.listEntities('campanhas', b.id).length, 0);
  // Ids maliciosos são recusados.
  assert.throws(() => store.getClinica('../alfa'), /inválido/);
  assert.throws(() => store.getEntity('campanhas', a.id, '..\\..\\x'), /inválido/);
});

test('falha de gravação é informada (nunca "salvo" sem confirmação)', () => {
  const c = store.createClinica('Clínica Falha');
  const alvo = path.join(store.dataDir(), 'campanhas', c.id);
  fs.mkdirSync(path.dirname(alvo), { recursive: true });
  fs.writeFileSync(alvo, 'isto é um arquivo, não uma pasta');
  assert.throws(() => store.createEntity('campanhas', c.id, { nome: 'X' }), (e) => e.name === 'StoreError' && /Não foi possível salvar/.test(e.message));
});

test('segredos nunca são gravados nos dados', () => {
  const c = store.createClinica('Clínica Segredo');
  const r = store.saveAnswers(c.id, 'clinica', { site: 'EAA' + 'b'.repeat(40) });
  assert.equal(r.ok, false);
  assert.match(r.erros.site, /token/);
  assert.throws(() => store.createEntity('criativos', c.id, { nota: 'access_token=abc123' }), /segredo/);
});

test('sessão: resumo estruturado e retomada com próximo passo', () => {
  const c = store.createClinica('Clínica Sessão');
  assert.throws(() => store.saveSessao(c.id, { solicitacao: 'x' }), /incompleto/);
  store.saveSessao(c.id, { solicitacao: 'Criar campanha WhatsApp', objetivo: 'whatsapp', decisoes: 'Raio 8 km', proximoPasso: 'Enviar criativo' });
  let r = store.retomada(c.id);
  assert.equal(r.ultimaSessao.solicitacao, 'Criar campanha WhatsApp');
  assert.equal(r.proximaAcao, 'Enviar criativo');
  store.setTarefa(c.id, { objetivo: 'whatsapp', etapa: 'criativo', titulo: 'Clientes no WhatsApp' });
  r = store.retomada(c.id);
  assert.match(r.proximaAcao, /Continuar: Clientes no WhatsApp \(etapa criativo\)/);
  store.setTarefa(c.id, null);
  assert.equal(store.retomada(c.id).tarefaEmAndamento, null);
});

test('retomada aponta monitoramento vencido', () => {
  const c = store.createClinica('Clínica Monitor');
  store.createEntity('campanhas', c.id, { nome: 'C1', estado: 'programada', proximoMonitoramento: new Date(Date.now() - 3600e3).toISOString() });
  const r = store.retomada(c.id);
  assert.equal(r.monitoramentosVencidos.length, 1);
  assert.match(r.proximaAcao, /Monitorar a campanha C1/);
});

test('CRM: etapas, venda exige valor, exclusão LGPD sem dados pessoais no histórico', () => {
  const c = store.createClinica('Clínica CRM');
  const ct = store.addContato(c.id, { nome: 'Ana', telefone: '11999990000', procedimento: 'Limpeza', origem: 'anuncio' });
  assert.equal(ct.etapa, 'novo');
  store.updateContato(c.id, ct.id, { etapa: 'agendado' });
  assert.throws(() => store.updateContato(c.id, ct.id, { etapa: 'venda' }), /valor vendido/);
  const v = store.updateContato(c.id, ct.id, { etapa: 'venda', valorVendido: '180,00' });
  assert.equal(v.valorVendido, 180);
  assert.throws(() => store.updateContato(c.id, ct.id, { etapa: 'inventada' }), /Etapa inválida/);
  store.deleteContato(c.id, ct.id, 'pedido do titular');
  assert.equal(store.readCrm(c.id).contatos.length, 0);
  const del = store.readAudit(c.id).find((a) => a.acao === 'crm_contato_excluido');
  assert.ok(del && !JSON.stringify(del).includes('Ana') && !JSON.stringify(del).includes('11999990000'));
});

test('histórico de entidade acumula alterações (auditoria)', () => {
  const c = store.createClinica('Clínica Auditoria');
  const cp = store.createEntity('campanhas', c.id, { nome: 'C', estado: 'rascunho' });
  store.updateEntity('campanhas', c.id, cp.id, { estado: 'programada' }, 'publicada', { estado: 'programada' });
  store.updateEntity('campanhas', c.id, cp.id, { estado: 'pausada' }, 'campanha_pausada', { justificativa: 'custo alto' });
  const r = store.getEntity('campanhas', c.id, cp.id);
  assert.deepEqual(r.historico.map((h) => h.acao), ['criado', 'publicada', 'campanha_pausada']);
  assert.equal(r.clinicaId, c.id);
});
