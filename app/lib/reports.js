'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Relatórios: simples (gestora) e técnico (análise). Cada número mostra a origem.
// Nunca declara vencedor só porque a campanha completou 7 dias.

const config = require('./config');
const store = require('./store');
const { funilCrm, diagnostico, classificarCriativo, custoPorSeguidor } = require('./metrics');

const ORIGEM_LABEL = { meta: 'Meta', clinica: 'Clínica', calculo: 'Cálculo', estimativa: 'Estimativa', ausente: 'Ausente' };

function fmt(d, money = false) {
  if (!d || d.valor === null || d.valor === undefined) return `— (${ORIGEM_LABEL.ausente})`;
  const v = money ? `R$ ${Number(d.valor).toFixed(2).replace('.', ',')}` : String(d.valor);
  return `${v} (${ORIGEM_LABEL[d.origem] || d.origem})`;
}

// Consolida o último monitoramento de cada campanha + CRM de um período.
function semanal(clinicaId, { inicio, fim } = {}) {
  const c = store.requireClinica(clinicaId);
  const fimD = fim ? new Date(fim) : new Date();
  const iniD = inicio ? new Date(inicio) : new Date(fimD.getTime() - 7 * 864e5);
  const campanhas = store.listEntities('campanhas', clinicaId);
  const monit = store.listEntities('monitoramento', clinicaId).filter((m) => new Date(m.criadoEm) >= iniD && new Date(m.criadoEm) <= fimD);
  const crm = store.readCrm(clinicaId).contatos.filter((x) => !x.dataEntrada || (new Date(x.dataEntrada) >= new Date(iniD.toISOString().slice(0, 10)) && new Date(x.dataEntrada) <= fimD));
  const funil = funilCrm(crm);
  const diag = diagnostico({ cliques: null, conversas: funil.contatos.valor, responderam: funil.responderam.valor, qualificados: funil.qualificados.valor, agendados: funil.agendados.valor, compareceram: funil.compareceram.valor, vendas: funil.vendas.valor });
  const porCampanha = campanhas.filter((x) => x.estado !== 'rascunho').map((cp) => {
    const ult = monit.filter((m) => m.campanhaId === cp.id)[0] || null;
    return { id: cp.id, nome: cp.nome, estado: cp.estado, metaIds: cp.metaIds || null, ultimoMonitoramento: ult };
  });
  const decisoes = store.readAudit(clinicaId, { limite: 500 }).filter((a) => new Date(a.ts) >= iniD && /decisao|publicad|pausad|escala|monitoramento_criado/.test(a.acao));
  return { clinica: c.respostas.clinica.nome_comercial, periodo: { inicio: iniD.toISOString().slice(0, 10), fim: fimD.toISOString().slice(0, 10) }, porCampanha, funil, diagnostico: diag, decisoes };
}

function semanalMarkdown(clinicaId, opts) {
  const r = semanal(clinicaId, opts);
  const L = [];
  L.push(`# Relatório semanal — ${r.clinica}`);
  L.push(`Período: ${r.periodo.inicio} a ${r.periodo.fim} · Gerado em ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`);
  L.push('');
  L.push('## Resumo para a gestora');
  L.push(`- Contatos que chegaram: ${fmt(r.funil.contatos)}`);
  L.push(`- Agendaram: ${fmt(r.funil.agendados)} · Compareceram: ${fmt(r.funil.compareceram)} · Compraram: ${fmt(r.funil.vendas)}`);
  L.push(`- Faturamento registrado no CRM: ${fmt(r.funil.faturamento, true)}`);
  L.push(`- ${r.diagnostico.conclusao}`);
  L.push('');
  L.push('## Campanhas');
  if (!r.porCampanha.length) L.push('Nenhuma campanha publicada registrada.');
  for (const cp of r.porCampanha) {
    L.push(`### ${cp.nome}`);
    L.push(`- Estado registrado: ${cp.estado}`);
    const m = cp.ultimoMonitoramento;
    if (!m) { L.push('- Sem monitoramento nesta semana.'); continue; }
    const met = m.metricas || {};
    L.push(`- Investimento: ${fmt(met.investimento, true)} · Impressões: ${fmt(met.impressoes)} · Alcance: ${fmt(met.alcance)}`);
    L.push(`- CTR: ${fmt(met.ctr)} · CPC: ${fmt(met.cpc, true)} · CPM: ${fmt(met.cpm, true)} · Frequência: ${fmt(met.frequencia)}`);
    L.push(`- Conversas: ${fmt(met.conversas)} · Custo por conversa: ${fmt(met.custoPorConversa, true)}`);
    if (m.custoSeguidor) L.push(`- Custo por seguidor: ${m.custoSeguidor.valor === null ? 'não calculável' : 'R$ ' + m.custoSeguidor.valor} — ${m.custoSeguidor.explicacao}`);
    for (const cl of m.classificacoes || []) L.push(`- Criativo "${cl.anuncio || cl.anuncioId}": **${cl.rotulo}** — ${cl.justificativa.join(' ')}`);
    if (m.recomendacao) L.push(`- Recomendação registrada: ${m.recomendacao}`);
  }
  L.push('');
  L.push('## Diagnóstico do funil (dados da clínica)');
  for (const a of r.diagnostico.achados) L.push(`- ${a.gargalo} (${a.severidade}): ${a.acao}`);
  if (!r.diagnostico.achados.length) L.push('- Nenhum gargalo evidente com os dados disponíveis.');
  if (r.diagnostico.dadosAusentes.length) L.push(`- Dados ausentes: ${r.diagnostico.dadosAusentes.join(', ')}`);
  L.push('');
  L.push('## Decisões e alterações da semana');
  for (const d of r.decisoes) L.push(`- ${d.ts.slice(0, 16).replace('T', ' ')} — ${d.acao}`);
  if (!r.decisoes.length) L.push('- Nenhuma.');
  L.push('');
  L.push('## Legenda de origem');
  L.push('Meta = confirmado pela Meta · Clínica = informado pela clínica · Cálculo = derivado · Estimativa = aproximação · Ausente = não disponível.');
  L.push('Completar 7 dias não torna uma campanha vencedora: a decisão considera volume, qualidade dos contatos, custo e ciclo de compra.');
  L.push('');
  L.push(`---\n${config.COPYRIGHT}`);
  return L.join('\n');
}

// Monta um registro de monitoramento a partir de linhas de insights + dados da clínica.
function montarMonitoramento({ clinica, campanha, linhas, crmContatos, respostasGestora = {}, cfgClassificacao = {} }) {
  const { parseInsightRow } = require('./metrics');
  const parsed = linhas.map(parseInsightRow);
  const soma = (k) => { const vals = parsed.map((p) => p[k].valor).filter((v) => v !== null); return vals.length ? vals.reduce((a, b) => a + b, 0) : null; };
  const inv = soma('investimento'); const conv = soma('conversas'); const imp = soma('impressoes'); const cliques = soma('cliques');
  const metricas = {
    investimento: { valor: inv, origem: inv === null ? 'ausente' : 'meta' },
    impressoes: { valor: imp, origem: imp === null ? 'ausente' : 'meta' },
    alcance: parsed.length === 1 ? parsed[0].alcance : { valor: null, origem: 'ausente' },
    cliques: { valor: cliques, origem: cliques === null ? 'ausente' : 'meta' },
    ctr: parsed.length === 1 ? parsed[0].ctr : { valor: imp && cliques !== null ? Math.round((cliques / imp) * 10000) / 100 : null, origem: imp && cliques !== null ? 'calculo' : 'ausente' },
    cpc: parsed.length === 1 ? parsed[0].cpc : { valor: inv !== null && cliques ? Math.round((inv / cliques) * 100) / 100 : null, origem: inv !== null && cliques ? 'calculo' : 'ausente' },
    cpm: parsed.length === 1 ? parsed[0].cpm : { valor: inv !== null && imp ? Math.round((inv / imp) * 100000) / 100 : null, origem: inv !== null && imp ? 'calculo' : 'ausente' },
    frequencia: parsed.length === 1 ? parsed[0].frequencia : { valor: null, origem: 'ausente' },
    conversas: { valor: conv, origem: conv === null ? 'ausente' : 'meta' },
    custoPorConversa: { valor: inv !== null && conv ? Math.round((inv / conv) * 100) / 100 : null, origem: inv !== null && conv ? 'calculo' : 'ausente' },
  };
  const funil = funilCrm(crmContatos || [], { campanhaId: campanha.id });
  const diag = diagnostico({ cliques, conversas: conv, responderam: funil.responderam.valor, qualificados: funil.qualificados.valor, agendados: funil.agendados.valor, compareceram: funil.compareceram.valor, vendas: funil.vendas.valor, tempoRespostaLento: respostasGestora.houveDemora === 'sim' });
  const dias = campanha.inicioUnix ? Math.max(0, Math.floor((Date.now() / 1000 - campanha.inicioUnix) / 86400)) : null;
  const classificacoes = parsed.map((p) => ({
    anuncio: p.anuncio, anuncioId: p.anuncioId,
    ...classificarCriativo({
      investimento: p.investimento.valor,
      resultados: campanha.objetivo === 'whatsapp' ? p.conversas.valor : p.cliques.valor,
      diasRodando: dias,
      custoAlvo: respostasGestora.custoAlvo != null && respostasGestora.custoAlvo !== '' ? Number(respostasGestora.custoAlvo) : null,
      qualificados: parsed.length === 1 ? funil.qualificados.valor : null,
      agendamentos: parsed.length === 1 ? funil.agendados.valor : null,
      capacidadeDisponivel: respostasGestora.capacidadeDisponivel !== 'nao',
    }, cfgClassificacao),
  }));
  let custoSeguidor = null;
  if (campanha.objetivo === 'seguidores') {
    custoSeguidor = custoPorSeguidor({ investimento: inv, seguidoresAtribuidos: respostasGestora.seguidoresAtribuidos ?? null, crescimentoPerfil: respostasGestora.crescimentoPerfil ?? null, metas: clinica.metas.custoSeguidor });
  }
  return { campanhaId: campanha.id, metricas, funil, diagnostico: diag, classificacoes, custoSeguidor, respostasGestora, diasRodando: dias };
}

module.exports = { semanal, semanalMarkdown, montarMonitoramento };
