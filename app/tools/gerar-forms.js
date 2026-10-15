'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Gera core/forms/*.md a partir de app/lib/questions.js (fonte única das perguntas usadas pela
// interface). Rodar após alterar perguntas: node app/tools/gerar-forms.js
// O teste test/forms-sync.test.js falha se os arquivos estiverem desatualizados.

const fs = require('fs');
const path = require('path');
const { QUESTIONS, OBJETIVOS } = require('../lib/questions');
const config = require('../lib/config');

const INTRO = {
  clinica: {
    titulo: 'Questionário da clínica (D1 — Direção)',
    quando: 'No primeiro uso e sempre que um objetivo precisar de um dado ainda não cadastrado. Responsável: Entrada.',
    interpretacao: [
      'Preços, condições e diferenciais são usados literalmente nos textos: nunca completar com suposições.',
      'Sem `informacoes_validadas = "Sim, já validou"`, nenhuma afirmação clínica é usada em anúncio ou atendimento.',
      '`capacidade_semana` limita a escala: sem agenda, não se recomenda aumentar procura.',
      '`orcamento_diario` × 30,4 não pode passar de `limite_mensal` (o plano de campanha bloqueia).',
      '`mapa_link` é convertido em coordenadas para o raio do anúncio; se não houver coordenadas, a tela pede o link completo.',
    ],
  },
  publico: {
    titulo: 'Questionário do público e objeções (D2 — Descoberta)',
    quando: 'Antes de criar copy, criativos, scripts ou nomes de método. Responsáveis: Entrada e Criativo.',
    interpretacao: [
      'Marcar apenas objeções efetivamente ouvidas de clientes reais; as opções são hipóteses iniciais a pesquisar, não fatos.',
      'Nunca atribuir medos, condições clínicas ou características pessoais a alguém sem evidência.',
      'As respostas viram: biblioteca de objeções, perguntas frequentes, ideias de conteúdo, ângulos de copy, scripts de atendimento e hipóteses de criativo (`gen.respostasObjecoes`).',
      'Idade mínima e máxima definem o público do anúncio; idade mínima nunca abaixo de 18.',
    ],
  },
  campanha: {
    titulo: 'Questionário da campanha (D3 — Demanda)',
    quando: 'A cada nova campanha (WhatsApp, seguidores, reconhecimento). Responsável: Mídia.',
    interpretacao: [
      'Oferta só com condição real e data de validade; sem validade, a triagem pede ajuste.',
      '`duracao_dias` é o prazo mínimo antes da decisão sobre o criativo; o monitoramento de D+3 é checagem de saúde.',
      'O orçamento sugerido vem do cadastro da clínica e pode ser alterado para esta campanha.',
    ],
  },
  criativo: {
    titulo: 'Questionário do criativo (D4 — Desenvolvimento de Criativos)',
    quando: 'Antes de produzir, adaptar ou modelar qualquer peça. Responsável: Criativo.',
    interpretacao: [
      'Referência sem dados de desempenho é hipótese, não prova.',
      'Se aparecer cliente, a autorização de uso de imagem por escrito é obrigatória (a triagem bloqueia sem ela).',
      'Com post do Instagram que foi bem, preferir usá-lo como criativo (ID do post).',
    ],
  },
  meta: {
    titulo: 'Questionário de ponto de partida da Meta (D3 — Demanda)',
    quando: 'Ao abrir "Configurar a Meta" pela primeira vez em uma clínica. Responsáveis: Entrada e Suporte.',
    interpretacao: [
      '`ja_anuncia = Sim` → a clínica vai direto para conectar a conta e a conferência automática pela API (botão "Conferir tudo").',
      '`ja_anuncia = Não` ou `Não sei` → o sistema pergunta item por item (página, Instagram profissional, portfólio empresarial/BM, conta de anúncios, pagamento, WhatsApp) e mostra o passo a passo com link oficial só para o que falta (`app/lib/onboarding.js`).',
      'As respostas são o que a gestora declara; depois de conectar, a conferência pela API é que confirma. Se a API não conseguir ler um item (pagamento, WhatsApp), ele aparece como "conferir", nunca como pronto.',
      'Limite real: o sistema não cria página, Instagram profissional nem forma de pagamento. Essas etapas são feitas pela dona das contas, logada no Facebook dela.',
    ],
  },
  atendimento: {
    titulo: 'Questionário do atendimento (D5 — Diálogo e Conversão)',
    quando: 'Antes de gerar scripts e treinamento, e quando o diagnóstico apontar gargalo no atendimento. Responsável: Atendimento.',
    interpretacao: [
      'As respostas aprovadas pela profissional são o único texto clínico que os scripts podem usar.',
      'As dificuldades marcadas orientam quais módulos do treinamento priorizar.',
    ],
  },
};

function objetivosQueUsam(ref) {
  return Object.entries(OBJETIVOS).filter(([, v]) => v.precisa.includes(ref)).map(([k]) => k);
}

function render(form) {
  const intro = INTRO[form];
  const qs = QUESTIONS.filter((q) => q.form === form);
  const L = [];
  L.push(`# ${intro.titulo}`);
  L.push('');
  L.push(`${config.COPYRIGHT}`);
  L.push('');
  L.push('> Arquivo gerado a partir de `app/lib/questions.js` (a mesma lista usada pela interface). Para alterar perguntas, edite `questions.js` e rode `node app/tools/gerar-forms.js`.');
  L.push('');
  L.push(`**Quando usar:** ${intro.quando}`);
  L.push('');
  L.push('## Como conduzir');
  L.push('- Uma pergunta por vez, em linguagem simples, com botões quando houver opções.');
  L.push('- Só perguntar o que falta para o objetivo escolhido; nunca repetir o que já está salvo (salvo para confirmar).');
  L.push('- Mostrar progresso; permitir "Voltar e editar" e revisão posterior em "Editar cadastro".');
  L.push('- Toda resposta é validada e gravada com conferência; cada alteração fica no histórico (antes → depois).');
  L.push('- Resposta que pareça token ou senha é recusada.');
  L.push('');
  L.push('## Perguntas');
  L.push('');
  L.push('| Campo | Pergunta | Tipo | Opções | Obrigatória | Usada nos objetivos | Orientação |');
  L.push('|---|---|---|---|---|---|---|');
  for (const q of qs) {
    const ref = `${q.form}.${q.id}`;
    const opc = q.opcoes ? q.opcoes.join(' · ') : q.fonte ? `(opções de ${q.fonte})` : '—';
    L.push(`| \`${q.id}\` | ${q.texto} | ${q.tipo} | ${opc} | ${q.obrigatorio ? 'sim' : 'não'} | ${objetivosQueUsam(ref).join(', ') || '—'} | ${q.ajuda || ''} |`);
  }
  L.push('');
  L.push('## Como interpretar as respostas');
  for (const i of intro.interpretacao) L.push(`- ${i}`);
  L.push('');
  L.push('## Registro e próximo passo');
  L.push('- Gravação: interface (`POST /api/clinicas/<id>/respostas`) ou `node app/cli.js responder <clinica> ' + form + ' <campo> "<valor>"`.');
  L.push('- Só dizer "salvo" quando o retorno for `ok: true`. Com `ok: false`, mostrar o erro do campo e perguntar de novo.');
  L.push('- Ao completar as perguntas do objetivo, a interface segue automaticamente para a próxima etapa do fluxo.');
  L.push('');
  return L.join('\n');
}

function gerar(dir = path.join(config.ROOT, 'core', 'forms')) {
  fs.mkdirSync(dir, { recursive: true });
  const out = {};
  for (const form of Object.keys(INTRO)) {
    const file = path.join(dir, `questionario-${form}.md`);
    out[file] = render(form);
  }
  return out;
}

if (require.main === module) {
  for (const [file, txt] of Object.entries(gerar())) {
    fs.writeFileSync(file, txt, 'utf8');
    process.stdout.write(`gerado: ${path.relative(config.ROOT, file)}\n`);
  }
}

module.exports = { gerar, render };
