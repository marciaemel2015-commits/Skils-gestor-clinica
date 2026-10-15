'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Persistência local por clínica. Regras:
//  - Cada registro carrega clinicaId e só é lido dentro da pasta daquela clínica.
//  - Toda gravação é atômica (arquivo temporário + rename) e conferida por releitura.
//    Se a conferência falhar, lança StoreError — nunca dizer "salvo" sem confirmação.
//  - Histórico de auditoria append-only (historico.jsonl), sem segredos (redact).
//  - Nenhum token/senha é gravado aqui. Credenciais ficam em secrets.js.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const { redact, containsSecret } = require('./redact');
const { formQuestions, getQuestion, validateAnswer, normalizeAnswer } = require('./questions');

class StoreError extends Error {
  constructor(msg, cause) {
    super(msg);
    this.name = 'StoreError';
    this.cause = cause;
  }
}

const ID_RE = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;
const KINDS = ['campanhas', 'criativos', 'monitoramento', 'sessoes'];

function dataDir() {
  return process.env.M6D_DATA_DIR || config.DATA_DIR;
}

function assertId(id, label = 'id') {
  if (typeof id !== 'string' || !ID_RE.test(id)) throw new StoreError(`${label} inválido: use apenas letras minúsculas, números e hífen.`);
  return id;
}

function slugify(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function within(base, target) {
  const rel = path.relative(base, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new StoreError('Acesso fora da área permitida bloqueado.');
  return target;
}

function clinicDir(clinicaId) {
  assertId(clinicaId, 'clínica');
  return within(dataDir(), path.join(dataDir(), 'clinicas', clinicaId));
}

function kindDir(kind, clinicaId) {
  if (!KINDS.includes(kind) && kind !== 'crm') throw new StoreError(`Tipo de registro desconhecido: ${kind}`);
  assertId(clinicaId, 'clínica');
  return within(dataDir(), path.join(dataDir(), kind, clinicaId));
}

function writeJsonAtomic(file, obj) {
  if (containsSecret(obj)) throw new StoreError('Gravação bloqueada: o conteúdo parece conter um token ou segredo.');
  const json = JSON.stringify(obj, null, 2);
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(tmp, json, { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmp, file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
    throw new StoreError(`Não foi possível salvar (${path.basename(file)}): ${e.code || e.message}. Nada foi alterado.`, e);
  }
  let back;
  try {
    back = fs.readFileSync(file, 'utf8');
  } catch (e) {
    throw new StoreError(`Gravação não confirmada (${path.basename(file)}): ${e.code || e.message}.`, e);
  }
  if (back !== json) throw new StoreError(`Gravação não confirmada (${path.basename(file)}): conteúdo divergente.`);
  return { ok: true, arquivo: path.relative(dataDir(), file) };
}

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return fallback;
    throw new StoreError(`Arquivo corrompido ou ilegível: ${path.basename(file)} (${e.message})`, e);
  }
}

function now() {
  return new Date().toISOString();
}

function newId(prefix) {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}-${d}-${crypto.randomBytes(3).toString('hex')}`;
}

// ---------------- Auditoria ----------------
function audit(clinicaId, acao, detalhes = {}) {
  const file = path.join(clinicDir(clinicaId), 'historico.jsonl');
  const entry = { ts: now(), clinicaId, acao, detalhes: redact(detalhes) };
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, JSON.stringify(entry) + '\n', { encoding: 'utf8', mode: 0o600 });
  } catch (e) {
    throw new StoreError(`Não foi possível registrar o histórico: ${e.code || e.message}`, e);
  }
  return entry;
}

function readAudit(clinicaId, { limite = 200 } = {}) {
  const file = path.join(clinicDir(clinicaId), 'historico.jsonl');
  let txt;
  try { txt = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  const lines = txt.split('\n').filter(Boolean);
  return lines.slice(-limite).map((l) => { try { return JSON.parse(l); } catch (_) { return { ts: null, acao: 'linha_ilegivel' }; } });
}

// ---------------- Clínicas ----------------
function clinicFile(clinicaId) {
  return path.join(clinicDir(clinicaId), 'clinica.json');
}

function createClinica(nome) {
  if (!nome || !String(nome).trim()) throw new StoreError('Informe o nome da clínica.');
  let base = slugify(nome) || 'clinica';
  if (base.length < 3) base = `clinica-${base}`;
  let id = base;
  let n = 2;
  while (fs.existsSync(clinicFile(id))) id = `${base}-${n++}`;
  const rec = {
    id,
    clinicaId: id,
    criadoEm: now(),
    atualizadoEm: now(),
    versaoMetodo: config.METHOD_VERSION,
    respostas: { clinica: { nome_comercial: String(nome).trim() }, publico: {}, campanha: {}, criativo: {}, atendimento: {} },
    meta: { adAccountId: null, pageId: null, instagramUserId: null, timezone: null, currency: null, conectadoEm: null },
    metas: { custoSeguidor: { ...config.FOLLOWER_COST_DEFAULT } },
  };
  const res = writeJsonAtomic(clinicFile(id), rec);
  audit(id, 'clinica_criada', { nome: rec.respostas.clinica.nome_comercial });
  return { ...rec, _gravacao: res };
}

function getClinica(clinicaId) {
  const rec = readJson(clinicFile(clinicaId));
  if (!rec) return null;
  if (rec.clinicaId !== clinicaId) throw new StoreError('Registro de clínica inconsistente (isolamento violado).');
  return rec;
}

function requireClinica(clinicaId) {
  const c = getClinica(clinicaId);
  if (!c) throw new StoreError(`Clínica não encontrada: ${clinicaId}`);
  return c;
}

function listClinicas() {
  const dir = path.join(dataDir(), 'clinicas');
  let names = [];
  try { names = fs.readdirSync(dir); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return names
    .filter((n) => ID_RE.test(n))
    .map((n) => { try { return getClinica(n); } catch (_) { return null; } })
    .filter(Boolean)
    .map((c) => ({ id: c.id, nome: c.respostas.clinica.nome_comercial, atualizadoEm: c.atualizadoEm }));
}

// Grava respostas de um formulário. Valida cada uma, registra o que mudou (antes → depois).
function saveAnswers(clinicaId, form, answers) {
  const c = requireClinica(clinicaId);
  const allowed = new Map(formQuestions(form).map((x) => [x.id, x]));
  if (!allowed.size) throw new StoreError(`Formulário desconhecido: ${form}`);
  const erros = {};
  const mudancas = [];
  c.respostas[form] = c.respostas[form] || {};
  for (const [id, raw] of Object.entries(answers || {})) {
    const question = allowed.get(id) || getQuestion(`${form}.${id}`);
    if (!question) { erros[id] = 'Pergunta desconhecida.'; continue; }
    if (containsSecret(raw)) { erros[id] = 'Isto parece um token ou senha. Credenciais não são salvas aqui.'; continue; }
    const err = validateAnswer(question, raw);
    if (err) { erros[id] = err; continue; }
    const value = normalizeAnswer(question, raw);
    const antes = c.respostas[form][id];
    if (JSON.stringify(antes) !== JSON.stringify(value)) {
      mudancas.push({ campo: `${form}.${id}`, antes: antes === undefined ? null : antes, depois: value });
      c.respostas[form][id] = value;
    }
  }
  if (Object.keys(erros).length) return { ok: false, erros };
  if (!mudancas.length) return { ok: true, mudancas: [] };
  c.atualizadoEm = now();
  const res = writeJsonAtomic(clinicFile(clinicaId), c);
  audit(clinicaId, 'respostas_atualizadas', { form, mudancas });
  return { ok: true, mudancas, gravacao: res };
}

function updateClinicaMeta(clinicaId, patch) {
  const c = requireClinica(clinicaId);
  const allowed = ['adAccountId', 'pageId', 'instagramUserId', 'timezone', 'currency', 'conectadoEm', 'whatsappPhone', 'accountName'];
  const before = { ...c.meta };
  for (const k of Object.keys(patch)) if (allowed.includes(k)) c.meta[k] = patch[k];
  c.atualizadoEm = now();
  const res = writeJsonAtomic(clinicFile(clinicaId), c);
  audit(clinicaId, 'meta_ativos_atualizados', { antes: before, depois: c.meta });
  return { ok: true, meta: c.meta, gravacao: res };
}

function updateMetas(clinicaId, metas) {
  const c = requireClinica(clinicaId);
  const meta = Number(metas.meta);
  const critico = Number(metas.critico);
  if (!(meta > 0) || !(critico > meta)) throw new StoreError('A meta precisa ser maior que zero e a faixa crítica maior que a meta.');
  const antes = c.metas.custoSeguidor;
  c.metas.custoSeguidor = { meta, critico };
  c.atualizadoEm = now();
  writeJsonAtomic(clinicFile(clinicaId), c);
  audit(clinicaId, 'metas_atualizadas', { antes, depois: c.metas.custoSeguidor });
  return { ok: true, metas: c.metas };
}

// ---------------- Entidades por clínica (campanhas, criativos, monitoramento, sessões) ----------------
const PREFIX = { campanhas: 'cmp', criativos: 'cri', monitoramento: 'mon', sessoes: 'ses' };

function entityFile(kind, clinicaId, id) {
  assertId(id, 'registro');
  return within(kindDir(kind, clinicaId), path.join(kindDir(kind, clinicaId), `${id}.json`));
}

function createEntity(kind, clinicaId, data, acao) {
  requireClinica(clinicaId);
  const id = newId(PREFIX[kind]);
  const rec = { ...data, id, clinicaId, criadoEm: now(), atualizadoEm: now(), historico: [{ ts: now(), acao: acao || 'criado' }] };
  const res = writeJsonAtomic(entityFile(kind, clinicaId, id), rec);
  audit(clinicaId, `${kind}_criado`, { id, resumo: data.nome || data.titulo || data.tipo || null });
  return { ...rec, _gravacao: res };
}

function getEntity(kind, clinicaId, id) {
  const rec = readJson(entityFile(kind, clinicaId, id));
  if (!rec) return null;
  if (rec.clinicaId !== clinicaId) throw new StoreError('Registro pertence a outra clínica. Acesso bloqueado.');
  return rec;
}

function updateEntity(kind, clinicaId, id, patch, acao, detalhes = {}) {
  const rec = getEntity(kind, clinicaId, id);
  if (!rec) throw new StoreError(`Registro não encontrado: ${id}`);
  const { id: _i, clinicaId: _c, historico: _h, criadoEm: _cr, ...safe } = patch || {};
  Object.assign(rec, safe);
  rec.atualizadoEm = now();
  rec.historico.push({ ts: now(), acao: acao || 'atualizado', detalhes: redact(detalhes) });
  const res = writeJsonAtomic(entityFile(kind, clinicaId, id), rec);
  audit(clinicaId, `${kind}_${acao || 'atualizado'}`, { id, ...detalhes });
  return { ...rec, _gravacao: res };
}

function listEntities(kind, clinicaId) {
  const dir = kindDir(kind, clinicaId);
  let names = [];
  try { names = fs.readdirSync(dir); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  return names
    .filter((n) => n.endsWith('.json'))
    .map((n) => readJson(path.join(dir, n)))
    .filter((r) => r && r.clinicaId === clinicaId)
    .sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
}

// ---------------- CRM ----------------
const ETAPAS = ['novo', 'em_atendimento', 'qualificado', 'agendado', 'compareceu', 'venda'];
const ETAPAS_ALTERNATIVAS = ['sem_resposta', 'perdeu_interesse', 'nao_compareceu', 'encerrada'];
const ETAPA_LABEL = {
  novo: 'Novo contato', em_atendimento: 'Em atendimento', qualificado: 'Qualificado', agendado: 'Agendado',
  compareceu: 'Compareceu', venda: 'Venda concluída', sem_resposta: 'Sem resposta', perdeu_interesse: 'Sem interesse',
  nao_compareceu: 'Não compareceu', encerrada: 'Venda perdida',
};
// Campos permitidos: só o necessário para o trabalho comercial (LGPD — minimização).
const CRM_FIELDS = ['nome', 'telefone', 'origem', 'campanhaId', 'conjunto', 'anuncio', 'utm', 'dataEntrada', 'procedimento', 'etapa', 'agendamento', 'valorVendido', 'motivoPerda', 'proximaAcao', 'proximaAcaoData', 'consentimentoContato', 'preferenciaContato', 'observacao'];

function crmFile(clinicaId) {
  return path.join(kindDir('crm', clinicaId), 'contatos.json');
}

function readCrm(clinicaId) {
  requireClinica(clinicaId);
  const data = readJson(crmFile(clinicaId), { clinicaId, contatos: [] });
  if (data.clinicaId !== clinicaId) throw new StoreError('CRM pertence a outra clínica. Acesso bloqueado.');
  return data;
}

function sanitizeContato(input) {
  const out = {};
  for (const k of CRM_FIELDS) if (input[k] !== undefined) out[k] = typeof input[k] === 'string' ? input[k].trim().slice(0, 500) : input[k];
  if (out.etapa && !ETAPAS.includes(out.etapa) && !ETAPAS_ALTERNATIVAS.includes(out.etapa)) throw new StoreError(`Etapa inválida: ${out.etapa}`);
  if (out.valorVendido !== undefined && out.valorVendido !== '' && out.valorVendido !== null) {
    const n = Number(String(out.valorVendido).replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) throw new StoreError('Valor vendido inválido.');
    out.valorVendido = n;
  }
  return out;
}

function addContato(clinicaId, input) {
  const data = readCrm(clinicaId);
  const c = sanitizeContato(input);
  if (!c.nome) throw new StoreError('Informe pelo menos o primeiro nome do contato.');
  const contato = { id: newId('ctt'), etapa: 'novo', dataEntrada: now().slice(0, 10), origem: 'desconhecida', ...c, criadoEm: now(), atualizadoEm: now(), historico: [{ ts: now(), etapa: c.etapa || 'novo' }] };
  data.contatos.push(contato);
  const res = writeJsonAtomic(crmFile(clinicaId), data);
  audit(clinicaId, 'crm_contato_criado', { id: contato.id, etapa: contato.etapa, origem: contato.origem, campanhaId: contato.campanhaId || null });
  return { ...contato, _gravacao: res };
}

function updateContato(clinicaId, contatoId, patch) {
  const data = readCrm(clinicaId);
  const c = data.contatos.find((x) => x.id === contatoId);
  if (!c) throw new StoreError('Contato não encontrado.');
  const p = sanitizeContato(patch);
  const etapaAntes = c.etapa;
  Object.assign(c, p);
  c.atualizadoEm = now();
  if (p.etapa && p.etapa !== etapaAntes) c.historico.push({ ts: now(), etapa: p.etapa, de: etapaAntes });
  if (c.etapa === 'venda' && !(c.valorVendido > 0)) throw new StoreError('Para marcar venda realizada, informe o valor vendido.');
  if (ETAPAS_ALTERNATIVAS.includes(c.etapa) && c.etapa !== 'sem_resposta' && !c.motivoPerda) c.motivoPerda = 'não informado';
  const res = writeJsonAtomic(crmFile(clinicaId), data);
  audit(clinicaId, 'crm_contato_atualizado', { id: contatoId, de: etapaAntes, para: c.etapa });
  return { ...c, _gravacao: res };
}

// Exclusão a pedido da titular dos dados (LGPD). O histórico guarda só o id, sem dados pessoais.
function deleteContato(clinicaId, contatoId, motivo) {
  const data = readCrm(clinicaId);
  const idx = data.contatos.findIndex((x) => x.id === contatoId);
  if (idx < 0) throw new StoreError('Contato não encontrado.');
  data.contatos.splice(idx, 1);
  const res = writeJsonAtomic(crmFile(clinicaId), data);
  audit(clinicaId, 'crm_contato_excluido', { id: contatoId, motivo: motivo || 'solicitação' });
  return { ok: true, gravacao: res };
}

// ---------------- Sessões e continuidade ----------------
const SESSAO_CAMPOS = ['solicitacao', 'objetivo', 'informacoesColetadas', 'decisoes', 'arquivosAlterados', 'campanhaOuCriativo', 'acoesExecutadas', 'resultadosConfirmados', 'pendencias', 'proximoPasso', 'proximoMonitoramento'];

function saveSessao(clinicaId, resumo) {
  const missing = ['solicitacao', 'objetivo', 'proximoPasso'].filter((k) => !resumo || !resumo[k]);
  if (missing.length) throw new StoreError(`Resumo de sessão incompleto. Falta: ${missing.join(', ')}`);
  const data = {};
  for (const k of SESSAO_CAMPOS) data[k] = resumo[k] === undefined ? null : resumo[k];
  return createEntity('sessoes', clinicaId, data, 'sessao_registrada');
}

function setTarefa(clinicaId, tarefa) {
  requireClinica(clinicaId);
  const file = path.join(clinicDir(clinicaId), 'tarefa-atual.json');
  const rec = tarefa ? { ...tarefa, clinicaId, atualizadoEm: now() } : { clinicaId, concluida: true, atualizadoEm: now() };
  const res = writeJsonAtomic(file, rec);
  audit(clinicaId, tarefa ? 'tarefa_atualizada' : 'tarefa_concluida', { objetivo: tarefa ? tarefa.objetivo : null, etapa: tarefa ? tarefa.etapa : null });
  return { ...rec, _gravacao: res };
}

function getTarefa(clinicaId) {
  const rec = readJson(path.join(clinicDir(clinicaId), 'tarefa-atual.json'));
  if (rec && rec.clinicaId !== clinicaId) throw new StoreError('Tarefa pertence a outra clínica.');
  return rec && !rec.concluida ? rec : null;
}

// Retomada: onde parou, próxima ação e monitoramentos vencidos.
function retomada(clinicaId, ref = new Date()) {
  const c = requireClinica(clinicaId);
  const tarefa = getTarefa(clinicaId);
  const sessoes = listEntities('sessoes', clinicaId);
  const ultima = sessoes[0] || null;
  const campanhas = listEntities('campanhas', clinicaId);
  const monitoramentosVencidos = campanhas
    .filter((x) => x.proximoMonitoramento && new Date(x.proximoMonitoramento) <= ref && !['rascunho', 'encerrada'].includes(x.estado))
    .map((x) => ({ id: x.id, nome: x.nome, quando: x.proximoMonitoramento }));
  return {
    clinica: { id: c.id, nome: c.respostas.clinica.nome_comercial },
    tarefaEmAndamento: tarefa,
    ultimaSessao: ultima ? { quando: ultima.criadoEm, solicitacao: ultima.solicitacao, proximoPasso: ultima.proximoPasso, pendencias: ultima.pendencias } : null,
    monitoramentosVencidos,
    proximaAcao: tarefa ? `Continuar: ${tarefa.titulo || tarefa.objetivo} (etapa ${tarefa.etapa})` : monitoramentosVencidos.length ? `Monitorar a campanha ${monitoramentosVencidos[0].nome}` : ultima ? ultima.proximoPasso : 'Escolher um objetivo no menu principal',
  };
}

module.exports = {
  StoreError, ETAPAS, ETAPAS_ALTERNATIVAS, ETAPA_LABEL, CRM_FIELDS,
  slugify, assertId, writeJsonAtomic, readJson,
  audit, readAudit,
  createClinica, getClinica, requireClinica, listClinicas, saveAnswers, updateClinicaMeta, updateMetas,
  createEntity, getEntity, updateEntity, listEntities,
  readCrm, addContato, updateContato, deleteContato,
  saveSessao, setTarefa, getTarefa, retomada,
  dataDir,
};
