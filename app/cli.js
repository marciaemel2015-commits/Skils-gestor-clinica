#!/usr/bin/env node
'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// CLI usada pelos agentes (AGENTS.md) para ler e gravar a MESMA memória da interface.
// Nunca aceita tokens como argumento: credenciais só pela interface (campo seguro/OAuth).
// Uso: node app/cli.js <comando> [args]   (saída em JSON)

process.env.M6D_QUIET = '1';
const store = require('./lib/store');
const { missingFor, OBJETIVOS } = require('./lib/questions');
const { review } = require('./lib/compliance');
const gen = require('./lib/generators');
const reports = require('./lib/reports');
const { containsSecret } = require('./lib/redact');

const AJUDA = `Comandos:
  clinicas                                  lista as clínicas
  nova-clinica "<nome>"                      cadastra uma clínica
  retomada <clinica>                         onde parou, próxima ação, monitoramentos vencidos
  ver <clinica>                              cadastro completo (sem credenciais)
  faltam <clinica> <objetivo>                perguntas que faltam (objetivos: ${Object.keys(OBJETIVOS).join(', ')})
  responder <clinica> <form> <campo> <valor> grava uma resposta (valor pode ser JSON)
  compliance "<texto>"                       triagem de conformidade de um texto
  copies <clinica> <objetivo>                variações de copy com conformidade
  prompt-imagem <clinica>                    prompt completo de criativo estático
  roteiro-video <clinica>                    roteiro de vídeo
  scripts <clinica>                          scripts de WhatsApp + objeções
  treinamento <clinica>                      módulos, simulações e critérios
  nomes <clinica> '<json>'                   nomes de método ({"procedimento","desejo","diferencial","duracao"})
  campanhas <clinica>                        campanhas e estados
  crm <clinica>                              contatos e funil
  relatorio <clinica>                        relatório semanal (markdown)
  historico <clinica> [n]                    últimas n alterações
  tarefa <clinica> '<json>'|fim              grava a tarefa em andamento (ou conclui)
  sessao <clinica> '<json>'                  grava o resumo operacional da sessão`;

function out(x) { process.stdout.write((typeof x === 'string' ? x : JSON.stringify(x, null, 2)) + '\n'); }
function parse(v) { try { return JSON.parse(v); } catch (_) { return v; } }

function main(argv) {
  const [cmd, ...a] = argv;
  if (a.some((x) => containsSecret(x))) throw new Error('Credenciais não são aceitas pela linha de comando. Use "Configurar Meta" na interface.');
  switch (cmd) {
    case 'clinicas': return out(store.listClinicas());
    case 'nova-clinica': return out(store.createClinica(a[0]));
    case 'retomada': return out(store.retomada(a[0]));
    case 'ver': { const c = store.requireClinica(a[0]); return out({ id: c.id, respostas: c.respostas, metaAtivos: c.meta, metas: c.metas }); }
    case 'faltam': return out(missingFor(a[1], store.requireClinica(a[0]).respostas).map((q) => ({ ref: q.ref, texto: q.texto, tipo: q.tipo, opcoes: q.opcoes || null, ajuda: q.ajuda || null })));
    case 'responder': return out(store.saveAnswers(a[0], a[1], { [a[2]]: parse(a[3]) }));
    case 'compliance': return out(review({ textos: [a.join(' ')] }));
    case 'copies': return out(gen.copies(store.requireClinica(a[0]), a[1]));
    case 'prompt-imagem': return out(gen.promptEstatico(store.requireClinica(a[0])));
    case 'roteiro-video': return out(gen.roteiroVideo(store.requireClinica(a[0])));
    case 'scripts': return out(gen.scriptsWhatsapp(store.requireClinica(a[0])));
    case 'treinamento': return out(gen.treinamento(store.requireClinica(a[0])));
    case 'nomes': return out(gen.nomesMetodo(store.requireClinica(a[0]), parse(a[1] || '{}')));
    case 'campanhas': return out(store.listEntities('campanhas', a[0]).map((c) => ({ id: c.id, nome: c.nome, estado: c.estado, metaIds: c.metaIds || null, proximoMonitoramento: c.proximoMonitoramento || null, ultimaDecisao: c.ultimaDecisao || null })));
    case 'crm': { const { funilCrm } = require('./lib/metrics'); const d = store.readCrm(a[0]); return out({ total: d.contatos.length, funil: funilCrm(d.contatos) }); }
    case 'relatorio': return out(reports.semanalMarkdown(a[0]));
    case 'historico': return out(store.readAudit(a[0], { limite: Number(a[1] || 30) }));
    case 'tarefa': return out(store.setTarefa(a[0], a[1] === 'fim' ? null : parse(a[1])));
    case 'sessao': return out(store.saveSessao(a[0], parse(a[1])));
    default: return out(AJUDA);
  }
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (e) { process.stderr.write(`ERRO: ${e.message}\n`); process.exit(1); }
}

module.exports = { main };
