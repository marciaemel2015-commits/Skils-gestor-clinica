'use strict';
// Ambiente isolado para testes: pastas temporárias, cofre AES com chave de teste, log silencioso.
// Toda resposta "da Meta" nos testes vem de fetch SIMULADO (mock) e está marcada como SIMULAÇÃO.

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

function setupEnv(nome) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `m6d-${nome}-`));
  process.env.M6D_DATA_DIR = path.join(base, 'data');
  process.env.M6D_SECRETS_DIR = path.join(base, 'secrets');
  process.env.M6D_LOG_DIR = path.join(base, 'logs');
  process.env.M6D_QUIET = '1';
  process.env.M6D_SECRET_BACKEND = 'aes';
  process.env.M6D_SECRET_KEY = crypto.randomBytes(32).toString('hex');
  delete process.env.META_ACCESS_TOKEN;
  return base;
}

// SIMULAÇÃO da Graph API. routes: [{ match: (method, url, body) => bool, reply: (method,url,body) => ({status, body}) }]
function mockFetch(routes, calls = []) {
  return async function fetchSimulado(url, opts = {}) {
    const method = opts.method || 'GET';
    const body = opts.body ? Object.fromEntries(new URLSearchParams(opts.body)) : null;
    calls.push({ method, url: String(url), body });
    for (const r of routes) {
      if (r.match(method, String(url), body)) {
        const { status = 200, body: b = {} } = r.reply(method, String(url), body);
        return { ok: status < 400, status, json: async () => b, headers: { get: () => null } };
      }
    }
    return { ok: false, status: 404, json: async () => ({ error: { message: `SIMULAÇÃO: rota não simulada ${method} ${url}`, code: 100 } }), headers: { get: () => null } };
  };
}

const TOKEN_FALSO = 'EAAsimulado' + 'x'.repeat(40);

function clinicaCompleta(store, nome = 'Clínica Teste') {
  const c = store.createClinica(nome);
  store.saveAnswers(c.id, 'clinica', {
    cidade_uf: 'Campinas/SP', endereco: 'Rua Teste, 100 - Cambuí', mapa_link: 'https://www.google.com/maps/place/X/@-22.8936,-47.0533,17z', instagram: '@clinicateste',
    whatsapp: '(19) 99999-0000', crm: 'Planilha', cidades_atendidas: 'Campinas, Valinhos', raio_km: '8', local_atendimento: 'Só na clínica',
    procedimentos: 'Limpeza de pele, Toxina botulínica', procedimentos_prioritarios: 'Limpeza de pele', precos: 'Limpeza de pele R$ 180',
    diferenciais: 'Avaliação individual feita pela própria profissional antes de cada procedimento', capacidade_semana: '12', profissionais: 'Dra. Teste, biomédica esteta',
    informacoes_validadas: 'Ainda não', orcamento_diario: '30', limite_mensal: '1000', horario_funcionamento: 'seg a sex 9h-19h', quem_responde: 'Secretária/recepção',
  });
  store.saveAnswers(c.id, 'publico', { genero: 'Mulheres', idade_min: '25', idade_max: '55', desejos: 'se sentir bem com a própria pele', valoriza: ['Naturalidade', 'Segurança'], objecoes: ['Preço', 'Medo de sentir dor'] });
  store.saveAnswers(c.id, 'campanha', { procedimento: 'Limpeza de pele', orcamento_diario: '30', duracao_dias: '7' });
  store.saveAnswers(c.id, 'criativo', { tem_criativo: 'Sim, tenho o arquivo', formato: 'Imagem', quem_aparece: 'A profissional', autorizacao_imagem: 'Não vai aparecer cliente', modelar_ou_zero: 'Criar do zero' });
  // coordenadas como a interface grava após ler o link
  const full = store.requireClinica(c.id);
  full.respostas.clinica.mapa_coords = '-22.8936,-47.0533';
  store.writeJsonAtomic(path.join(store.dataDir(), 'clinicas', c.id, 'clinica.json'), full);
  return c.id;
}

module.exports = { setupEnv, mockFetch, TOKEN_FALSO, clinicaCompleta };
