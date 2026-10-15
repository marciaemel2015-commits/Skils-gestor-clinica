'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Cálculos, diagnóstico e classificação. Todo número carrega sua origem:
//   meta (confirmado pela Meta) | clinica (informado pela clínica) | calculo (derivado) | estimativa | ausente
// Nenhuma regra aqui é universal: limites são configuráveis por clínica e a ausência de dados
// sempre resulta em "inconclusivo", nunca em vencedor.

const ORIGENS = ['meta', 'clinica', 'calculo', 'estimativa', 'ausente'];

function dado(valor, origem) {
  if (!ORIGENS.includes(origem)) throw new Error(`Origem inválida: ${origem}`);
  if (valor === null || valor === undefined || Number.isNaN(valor)) return { valor: null, origem: 'ausente' };
  return { valor, origem };
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function div(a, b) {
  a = num(a); b = num(b);
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

function round(v, d = 2) {
  return v === null ? null : Math.round(v * 10 ** d) / 10 ** d;
}

// ---------- Custo por seguidor (protocolo seguidores-instagram) ----------
function custoPorSeguidor({ investimento, seguidoresAtribuidos, crescimentoPerfil, metas = { meta: 1, critico: 2 } }) {
  const inv = num(investimento);
  const seg = num(seguidoresAtribuidos);
  if (seg === null) {
    return {
      valor: null, origem: 'ausente', faixa: 'nao_calculavel',
      explicacao: crescimentoPerfil != null
        ? `O perfil cresceu ${crescimentoPerfil} seguidores no período, mas a Meta não atribuiu esse crescimento à campanha. Não é possível calcular o custo por seguidor da campanha.`
        : 'A Meta não informou seguidores atribuídos à campanha. Custo por seguidor não calculável.',
    };
  }
  if (inv === null) return { valor: null, origem: 'ausente', faixa: 'nao_calculavel', explicacao: 'Investimento não informado.' };
  if (seg === 0) return { valor: null, origem: 'calculo', faixa: inv > 0 ? 'critica' : 'nao_calculavel', explicacao: inv > 0 ? `Investimento de R$ ${inv.toFixed(2)} sem seguidores atribuídos. Investigar anúncio, público e perfil antes de qualquer decisão.` : 'Sem investimento.' };
  const valor = round(inv / seg);
  const faixa = valor < metas.meta ? 'meta' : valor < metas.critico ? 'atencao' : 'critica';
  const textos = {
    meta: 'Dentro da meta interna.',
    atencao: 'Faixa de atenção: acompanhar e preparar variações.',
    critica: 'Faixa crítica: investigar anúncio, público, conteúdo oferecido e experiência do perfil. Não pausar automaticamente com poucos resultados.',
  };
  return { valor, origem: 'calculo', faixa, explicacao: `${textos[faixa]} (metas configuráveis: < R$ ${metas.meta.toFixed(2)} meta; ≥ R$ ${metas.critico.toFixed(2)} crítica)` };
}

// ---------- Leitura de insights da Meta ----------
const CONVERSA_ACTIONS = ['onsite_conversion.messaging_conversation_started_7d', 'onsite_conversion.total_messaging_connection'];

function parseInsightRow(row = {}) {
  const actions = {};
  for (const a of row.actions || []) actions[a.action_type] = num(a.value);
  const conversas = CONVERSA_ACTIONS.map((k) => actions[k]).find((v) => v !== undefined && v !== null) ?? null;
  const spend = num(row.spend);
  return {
    investimento: dado(spend, 'meta'),
    impressoes: dado(num(row.impressions), 'meta'),
    alcance: dado(num(row.reach), 'meta'),
    cpm: dado(num(row.cpm), 'meta'),
    frequencia: dado(num(row.frequency), 'meta'),
    ctr: dado(num(row.ctr), 'meta'),
    cpc: dado(num(row.cpc), 'meta'),
    cliques: dado(num(row.clicks), 'meta'),
    conversas: dado(conversas, conversas === null ? 'ausente' : 'meta'),
    custoPorConversa: dado(round(div(spend, conversas)), 'calculo'),
    acoes: actions,
    periodo: { inicio: row.date_start || null, fim: row.date_stop || null },
    anuncio: row.ad_name || null,
    anuncioId: row.ad_id || null,
  };
}

// ---------- Funil a partir do CRM ----------
const ORDEM = ['novo', 'em_atendimento', 'qualificado', 'agendado', 'compareceu', 'venda'];

function funilCrm(contatos, { campanhaId } = {}) {
  const lista = campanhaId ? contatos.filter((c) => c.campanhaId === campanhaId) : contatos;
  const alcancou = Object.fromEntries(ORDEM.map((e) => [e, 0]));
  let faturamento = 0;
  const perdas = {};
  for (const c of lista) {
    const etapas = new Set((c.historico || []).map((h) => h.etapa).concat(c.etapa));
    let maxIdx = -1;
    for (const e of etapas) maxIdx = Math.max(maxIdx, ORDEM.indexOf(e));
    for (let i = 0; i <= maxIdx; i++) alcancou[ORDEM[i]]++;
    if (c.etapa === 'venda' && num(c.valorVendido)) faturamento += num(c.valorVendido);
    if (!ORDEM.includes(c.etapa)) perdas[c.motivoPerda || c.etapa] = (perdas[c.motivoPerda || c.etapa] || 0) + 1;
  }
  return {
    total: lista.length,
    contatos: dado(alcancou.novo, 'clinica'),
    responderam: dado(alcancou.em_atendimento, 'clinica'),
    qualificados: dado(alcancou.qualificado, 'clinica'),
    agendados: dado(alcancou.agendado, 'clinica'),
    compareceram: dado(alcancou.compareceu, 'clinica'),
    vendas: dado(alcancou.venda, 'clinica'),
    faturamento: dado(round(faturamento), 'clinica'),
    motivosPerda: perdas,
    origemNota: campanhaId ? 'Contatos vinculados a esta campanha no CRM (vínculo registrado pela clínica).' : 'Todos os contatos do CRM.',
  };
}

// ---------- Diagnóstico de gargalos (protocolo monitoramento) ----------
function diagnostico({ cliques, conversas, responderam, qualificados, agendados, compareceram, vendas, tempoRespostaLento }) {
  const v = { cliques: num(cliques), conversas: num(conversas), responderam: num(responderam), qualificados: num(qualificados), agendados: num(agendados), compareceram: num(compareceram), vendas: num(vendas) };
  const achados = [];
  const ausentes = Object.entries(v).filter(([, x]) => x === null).map(([k]) => k);
  const taxa = (a, b) => (v[a] !== null && v[b] !== null && v[b] > 0 ? v[a] / v[b] : null);
  const regras = [
    ['conversas', 'cliques', 0.1, 'Cliques sem conversas', 'Investigar o anúncio, o destino (o botão abre o WhatsApp certo?) e a experiência de contato.'],
    ['responderam', 'conversas', 0.5, 'Conversas sem resposta', 'Investigar a expectativa criada pelo anúncio e a primeira mensagem da equipe.'],
    ['agendados', 'responderam', 0.15, 'Conversas sem agendamento', 'Investigar a qualificação, as objeções que aparecem e a disponibilidade de horários.'],
    ['compareceram', 'agendados', 0.6, 'Agendamentos sem comparecimento', 'Investigar a confirmação na véspera e o acompanhamento até o dia.'],
    ['vendas', 'compareceram', 0.3, 'Comparecimentos sem venda', 'Investigar a oferta, a adequação do procedimento à cliente e o processo comercial na avaliação.'],
  ];
  for (const [a, b, ref, titulo, acao] of regras) {
    const t = taxa(a, b);
    if (t === null) continue;
    if (v[b] > 0 && v[a] === 0) achados.push({ gargalo: titulo, severidade: 'alta', taxa: 0, acao });
    else if (t < ref) achados.push({ gargalo: titulo, severidade: 'media', taxa: round(t * 100, 1), referenciaInterna: `${ref * 100}%`, acao });
  }
  if (tempoRespostaLento) achados.push({ gargalo: 'Demora no atendimento', severidade: 'media', acao: 'Responder novas conversas o quanto antes dentro do horário de atendimento; usar mensagem de boas-vindas.' });
  return {
    achados,
    dadosAusentes: ausentes,
    aviso: 'As referências de taxa são pontos internos de atenção, não metas universais. Compare sempre com o histórico da própria clínica.',
    conclusao: achados.length ? `Principal ponto a investigar: ${achados[0].gargalo}.` : ausentes.length ? 'Faltam dados para um diagnóstico completo.' : 'Nenhum gargalo evidente com os dados atuais.',
  };
}

// ---------- Classificação de criativos (protocolo validacao-e-escala) ----------
const CLASSES = {
  promissor: 'Promissor',
  inconclusivo: 'Inconclusivo',
  necessita_ajustes: 'Necessita ajustes',
  candidato_pausa: 'Candidato a pausa',
  candidato_escala: 'Candidato a escala',
};

function classificarCriativo(d, cfg = {}) {
  const c = { minDias: 5, minResultados: 10, qualidadeMinima: 0.3, ...cfg };
  const inv = num(d.investimento);
  const res = num(d.resultados);
  const dias = num(d.diasRodando);
  const alvo = num(d.custoAlvo);
  const qual = num(d.qualificados);
  const ag = num(d.agendamentos);
  const cpr = div(inv, res);
  const just = [];
  if (inv === null || res === null) return { classe: 'inconclusivo', rotulo: CLASSES.inconclusivo, justificativa: ['Faltam investimento ou resultados confirmados.'] };
  if (alvo !== null && res === 0 && inv >= 3 * alvo) {
    return { classe: 'candidato_pausa', rotulo: CLASSES.candidato_pausa, custoPorResultado: null, justificativa: [`Investiu R$ ${inv.toFixed(2)} (≥ 3× o custo-alvo de R$ ${alvo.toFixed(2)}) sem nenhum resultado.`, 'Antes de pausar, conferir se o destino e a entrega estão corretos.'] };
  }
  if ((dias !== null && dias < c.minDias) || res < c.minResultados) {
    just.push(`Volume ainda baixo (${res} resultados em ${dias ?? '?'} dias; mínimo configurado: ${c.minResultados} resultados e ${c.minDias} dias).`);
    return { classe: 'inconclusivo', rotulo: CLASSES.inconclusivo, custoPorResultado: round(cpr), justificativa: just };
  }
  const taxaQual = qual !== null && res > 0 ? qual / res : null;
  if (taxaQual === null) just.push('Qualidade dos contatos não informada pela clínica: não dá para declarar vencedor só pelo custo.');
  if (alvo === null) {
    just.push('Custo-alvo não definido pela clínica.');
    return { classe: taxaQual !== null && taxaQual >= c.qualidadeMinima ? 'promissor' : 'inconclusivo', rotulo: taxaQual !== null && taxaQual >= c.qualidadeMinima ? CLASSES.promissor : CLASSES.inconclusivo, custoPorResultado: round(cpr), justificativa: just };
  }
  if (cpr <= alvo) {
    if (taxaQual === null) return { classe: 'promissor', rotulo: CLASSES.promissor, custoPorResultado: round(cpr), justificativa: [...just, `Custo por resultado R$ ${cpr.toFixed(2)} dentro do alvo.`] };
    if (taxaQual < c.qualidadeMinima) return { classe: 'necessita_ajustes', rotulo: CLASSES.necessita_ajustes, custoPorResultado: round(cpr), justificativa: [`Custo baixo, mas só ${Math.round(taxaQual * 100)}% dos contatos eram qualificados. Clique ou conversa barata não é vencedor.`] };
    if (ag !== null && ag > 0 && d.capacidadeDisponivel !== false) return { classe: 'candidato_escala', rotulo: CLASSES.candidato_escala, custoPorResultado: round(cpr), justificativa: [`Custo R$ ${cpr.toFixed(2)} dentro do alvo, ${Math.round(taxaQual * 100)}% qualificados e ${ag} agendamento(s).`, 'Escalar de forma gradual e confirmar capacidade de atendimento.'] };
    return { classe: 'promissor', rotulo: CLASSES.promissor, custoPorResultado: round(cpr), justificativa: [`Custo dentro do alvo e boa qualificação, ${ag ? '' : 'mas ainda sem agendamentos registrados. '}Acompanhar a próxima janela.`.trim()] };
  }
  if (cpr <= 2 * alvo) return { classe: 'necessita_ajustes', rotulo: CLASSES.necessita_ajustes, custoPorResultado: round(cpr), justificativa: [...just, `Custo R$ ${cpr.toFixed(2)} acima do alvo (R$ ${alvo.toFixed(2)}). Testar variação de gancho ou formato mantendo o público.`] };
  return { classe: 'candidato_pausa', rotulo: CLASSES.candidato_pausa, custoPorResultado: round(cpr), justificativa: [...just, `Custo R$ ${cpr.toFixed(2)} acima de 2× o alvo com volume suficiente. Pausar (sem excluir) após confirmar com a gestora.`] };
}

module.exports = { dado, num, div, round, custoPorSeguidor, parseInsightRow, funilCrm, diagnostico, classificarCriativo, CLASSES, ORIGENS };
