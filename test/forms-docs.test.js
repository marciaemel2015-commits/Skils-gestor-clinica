'use strict';
// Garante que a documentação e o código não divergem, e que nenhum arquivo é só um título.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { gerar } = require('../app/tools/gerar-forms');

const ROOT = path.join(__dirname, '..');

test('core/forms/*.md estão sincronizados com as perguntas da interface', () => {
  for (const [file, esperado] of Object.entries(gerar())) {
    assert.ok(fs.existsSync(file), `falta ${file} — rode node app/tools/gerar-forms.js`);
    assert.equal(fs.readFileSync(file, 'utf8'), esperado, `${path.basename(file)} desatualizado — rode node app/tools/gerar-forms.js`);
  }
});

const OBRIGATORIOS = [
  'AGENTS.md', 'README.md', 'CHANGELOG.md',
  '.agents/rules/metodo-6d.md', '.agents/rules/seguranca.md', '.agents/rules/meta-ads.md', '.agents/rules/copy-e-criativos.md', '.agents/rules/atendimento-e-crm.md',
  'core/agents/entrada.md', 'core/agents/analista.md', 'core/agents/midia.md', 'core/agents/criativo.md', 'core/agents/atendimento.md', 'core/agents/suporte.md',
  ...['ciclo-de-campanha', 'segmentacao-local', 'seguidores-instagram', 'whatsapp-conversao', 'reconhecimento-local', 'remarketing', 'monitoramento', 'validacao-e-escala', 'crm-e-rastreamento', 'meta-ads-compliance', 'nomes-de-metodos'].map((n) => `core/protocols/${n}.md`),
  ...['clinica', 'publico', 'campanha', 'criativo', 'atendimento', 'meta'].map((n) => `core/forms/questionario-${n}.md`),
  ...['criativo-estatico', 'criativo-video', 'copy-anuncio', 'script-whatsapp', 'relatorio-monitoramento', 'relatorio-semanal', 'treinamento-equipe', 'checklist-publicacao', 'fluxo-whatsapp-automatico', 'politicas-agendamento', 'agente-ia-atendimento'].map((n) => `core/templates/${n}.md`),
  'core/CONTEXTO-CLINICA.md', 'core/STATUS-SQUAD.md',
  'docs/INSTALACAO.md', 'docs/CONFIGURACAO-META.md', 'docs/OPERACAO.md', 'docs/TESTES-E-LIMITACOES.md',
];

test('todos os arquivos da arquitetura existem, têm conteúdo real e o aviso de direitos', () => {
  for (const rel of OBRIGATORIOS) {
    const f = path.join(ROOT, rel);
    assert.ok(fs.existsSync(f), `falta ${rel}`);
    const txt = fs.readFileSync(f, 'utf8');
    assert.ok(txt.length > 1200, `${rel} curto demais (${txt.length} caracteres)`);
    assert.match(txt, /© 2026 — Método Clínica de Estética 6D/, `${rel} sem aviso de propriedade intelectual`);
  }
});

test('nenhum Markdown contém token ou segredo', () => {
  const walk = (d, out = []) => { for (const n of fs.readdirSync(d)) { if (['node_modules', 'data', 'secrets', 'logs', '.git'].includes(n)) continue; const p = path.join(d, n); fs.statSync(p).isDirectory() ? walk(p, out) : n.endsWith('.md') && out.push(p); } return out; };
  for (const f of walk(ROOT)) assert.ok(!/EAA[A-Za-z0-9]{20,}/.test(fs.readFileSync(f, 'utf8')), f);
});

test('.gitignore protege dados, segredos e logs', () => {
  const gi = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  for (const p of ['data/', 'secrets/', 'logs/']) assert.ok(gi.includes(p), p);
});
