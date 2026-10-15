'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { setupEnv } = require('./helpers');
setupEnv('compliance');
const { review, checkText } = require('../app/lib/compliance');
const m = require('../app/lib/metrics');
const { nextMidnight, monitoringDate } = require('../app/lib/schedule');
const { parseCoords } = require('../app/lib/geo');

// ---------- Conformidade ----------
test('conformidade: bloqueia promessas, dor, atributo pessoal e insegurança', () => {
  const casos = {
    garantia: 'Resultado garantido em todas as pacientes',
    promessa_absoluta: 'Elimine as rugas para sempre',
    sem_dor: 'Procedimento sem dor e rápido',
    imediato: 'Resultado imediato já na primeira sessão',
    atributo_pessoal: 'Você tem flacidez? Sua pele merece cuidado',
    inseguranca: 'Chega de vergonha do seu rosto',
    linguagem_medica: 'Cura definitiva para a acne',
  };
  for (const [regra, texto] of Object.entries(casos)) {
    const r = checkText(texto);
    assert.ok(r.some((i) => i.regra === regra && i.severidade === 'bloqueio'), `${regra} deveria bloquear: ${texto}`);
  }
  assert.equal(review({ textos: ['Elimine as rugas'] }).status, 'bloqueado');
});

test('conformidade: escassez exige validade real; oferta vencida bloqueia', () => {
  assert.equal(review({ textos: ['Últimas vagas para avaliação'] }).status, 'ajustar');
  assert.equal(review({ textos: ['Últimas vagas para avaliação'], ofertaValidade: '2099-12-31' }).status, 'verificar');
  const venc = review({ textos: ['Avaliação com condição especial'], oferta: 'R$ 150', ofertaValidade: '2020-01-01' });
  assert.equal(venc.status, 'bloqueado');
  assert.ok(venc.itens.find((i) => i.regra === 'oferta_vencida'));
});

test('conformidade: público menor de idade e imagem sem autorização bloqueiam', () => {
  assert.ok(review({ textos: ['Agende sua avaliação pelo WhatsApp'], idadeMin: 16 }).itens.find((i) => i.regra === 'menor_idade'));
  assert.equal(review({ textos: ['Agende'], quemAparece: 'Clientes com autorização assinada', autorizacaoImagem: 'Não' }).status, 'bloqueado');
});

test('conformidade: texto seguro passa sem alertas mas nunca promete aprovação', () => {
  const r = review({ textos: ['Na nossa clínica, cada atendimento começa com uma conversa. Toque em enviar mensagem e fale com a equipe.'], destino: 'whatsapp' });
  assert.equal(r.status, 'sem_alertas');
  assert.match(r.mensagem, /não garante aprovação/);
});

test('conformidade: marca registrada e estatística pedem verificação', () => {
  assert.ok(checkText('Botox com 98% de satisfação').some((i) => i.regra === 'marca_registrada'));
  assert.ok(checkText('Botox com 98% de satisfação').some((i) => i.regra === 'estatistica'));
});

// ---------- Custos ----------
test('custo por seguidor: faixas configuráveis e não atribuível', () => {
  const metas = { meta: 1, critico: 2 };
  assert.equal(m.custoPorSeguidor({ investimento: 90, seguidoresAtribuidos: 100, metas }).faixa, 'meta');
  assert.equal(m.custoPorSeguidor({ investimento: 150, seguidoresAtribuidos: 100, metas }).faixa, 'atencao');
  const crit = m.custoPorSeguidor({ investimento: 200, seguidoresAtribuidos: 100, metas });
  assert.equal(crit.faixa, 'critica'); assert.equal(crit.valor, 2);
  assert.match(crit.explicacao, /Não pausar automaticamente/);
  const na = m.custoPorSeguidor({ investimento: 100, seguidoresAtribuidos: null, crescimentoPerfil: 300, metas });
  assert.equal(na.faixa, 'nao_calculavel');
  assert.equal(na.valor, null);
  assert.match(na.explicacao, /não atribuiu/);
  assert.equal(m.custoPorSeguidor({ investimento: 150, seguidoresAtribuidos: 100, metas: { meta: 2, critico: 3 } }).faixa, 'meta', 'meta configurável');
});

test('insights: origem dos dados e custo por conversa calculado', () => {
  const p = m.parseInsightRow({ spend: '100', impressions: '5000', clicks: '80', ctr: '1.6', actions: [{ action_type: 'onsite_conversion.messaging_conversation_started_7d', value: '20' }] });
  assert.deepEqual(p.investimento, { valor: 100, origem: 'meta' });
  assert.deepEqual(p.custoPorConversa, { valor: 5, origem: 'calculo' });
  assert.equal(m.parseInsightRow({ spend: '10' }).conversas.origem, 'ausente');
});

test('dados ausentes viram "ausente", nunca zero inventado', () => {
  assert.deepEqual(m.dado(undefined, 'meta'), { valor: null, origem: 'ausente' });
  const d = m.diagnostico({ cliques: 100, conversas: null });
  assert.ok(d.dadosAusentes.includes('conversas'));
});

// ---------- Diagnóstico ----------
test('diagnóstico identifica cada gargalo do funil', () => {
  assert.equal(m.diagnostico({ cliques: 200, conversas: 0 }).achados[0].gargalo, 'Cliques sem conversas');
  assert.equal(m.diagnostico({ conversas: 40, responderam: 5 }).achados[0].gargalo, 'Conversas sem resposta');
  assert.equal(m.diagnostico({ responderam: 40, agendados: 0 }).achados[0].gargalo, 'Conversas sem agendamento');
  assert.equal(m.diagnostico({ agendados: 10, compareceram: 2 }).achados[0].gargalo, 'Agendamentos sem comparecimento');
  assert.equal(m.diagnostico({ compareceram: 10, vendas: 0 }).achados[0].gargalo, 'Comparecimentos sem venda');
});

// ---------- Classificação de criativos ----------
test('classificação: pouco volume é inconclusivo; clique barato não é vencedor', () => {
  assert.equal(m.classificarCriativo({ investimento: 60, resultados: 4, diasRodando: 2, custoAlvo: 20 }).classe, 'inconclusivo');
  const barato = m.classificarCriativo({ investimento: 100, resultados: 50, diasRodando: 7, custoAlvo: 10, qualificados: 5, agendamentos: 1 });
  assert.equal(barato.classe, 'necessita_ajustes');
  assert.match(barato.justificativa[0], /não é vencedor/);
  const esc = m.classificarCriativo({ investimento: 200, resultados: 25, diasRodando: 7, custoAlvo: 10, qualificados: 15, agendamentos: 6 });
  assert.equal(esc.classe, 'candidato_escala');
  assert.equal(m.classificarCriativo({ investimento: 200, resultados: 25, diasRodando: 7, custoAlvo: 10, qualificados: 15, agendamentos: 6, capacidadeDisponivel: false }).classe, 'promissor', 'sem agenda não escala');
  assert.equal(m.classificarCriativo({ investimento: 500, resultados: 20, diasRodando: 8, custoAlvo: 10 }).classe, 'candidato_pausa');
  assert.equal(m.classificarCriativo({ investimento: 70, resultados: 0, diasRodando: 1, custoAlvo: 20 }).classe, 'candidato_pausa', '3x o alvo sem resultado');
  assert.equal(m.classificarCriativo({ investimento: 200, resultados: 20, diasRodando: 7 }).classe, 'inconclusivo', 'sem alvo nem qualidade');
});

test('funil do CRM conta etapas alcançadas e faturamento', () => {
  const contatos = [
    { etapa: 'venda', valorVendido: 300, historico: [{ etapa: 'novo' }, { etapa: 'agendado' }, { etapa: 'venda' }], campanhaId: 'c1' },
    { etapa: 'nao_compareceu', motivoPerda: 'esqueceu', historico: [{ etapa: 'novo' }, { etapa: 'agendado' }, { etapa: 'nao_compareceu' }], campanhaId: 'c1' },
    { etapa: 'novo', historico: [{ etapa: 'novo' }], campanhaId: 'c2' },
  ];
  const f = m.funilCrm(contatos, { campanhaId: 'c1' });
  assert.equal(f.contatos.valor, 2); assert.equal(f.agendados.valor, 2); assert.equal(f.compareceram.valor, 1); assert.equal(f.vendas.valor, 1);
  assert.equal(f.faturamento.valor, 300); assert.equal(f.motivosPerda.esqueceu, 1);
});

// ---------- Programação e fuso ----------
test('programação: dia seguinte 00:00 no fuso da conta de anúncios', () => {
  const now = new Date('2026-10-14T15:00:00Z');
  const sp = nextMidnight('America/Sao_Paulo', now);
  assert.equal(sp.iso, '2026-10-15T00:00:00-03:00');
  assert.equal(sp.unix, Date.parse('2026-10-15T03:00:00Z') / 1000);
  assert.equal(sp.exata, true);
  // 23h30 do dia 14 em São Paulo (= 02:30 UTC do dia 15): o "dia seguinte" é o dia 15 local, não o 16.
  const tarde = nextMidnight('America/Sao_Paulo', new Date('2026-10-15T02:30:00Z'));
  assert.equal(tarde.iso, '2026-10-15T00:00:00-03:00');
  // 00h30 do dia 15 em São Paulo (= 03:30 UTC) → começa no dia 16.
  assert.equal(nextMidnight('America/Sao_Paulo', new Date('2026-10-15T03:30:00Z')).iso, '2026-10-16T00:00:00-03:00');
  // Fuso da conta diferente do fuso do computador.
  assert.equal(nextMidnight('Europe/Lisbon', now).iso, '2026-10-15T00:00:00+01:00');
  assert.equal(nextMidnight('America/Manaus', now).iso, '2026-10-15T00:00:00-04:00');
  // Mudança de horário de verão (Nova York, 08/03/2026).
  assert.equal(nextMidnight('America/New_York', new Date('2026-03-07T12:00:00Z')).iso, '2026-03-08T00:00:00-05:00');
  assert.throws(() => nextMidnight('Fuso/Inexistente', now), /inválido/);
});

test('data de monitoramento: N dias após o início, 10h no fuso da conta', () => {
  const start = Date.parse('2026-10-15T03:00:00Z') / 1000;
  assert.equal(monitoringDate(start, 3, 'America/Sao_Paulo'), '2026-10-18T13:00:00.000Z');
});

test('região: extrai coordenadas do link do Google Maps', () => {
  assert.deepEqual(parseCoords('https://www.google.com/maps/place/Cl%C3%ADnica/@-22.8936,-47.0533,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-22.89361!4d-47.05331'), { latitude: -22.89361, longitude: -47.05331 });
  assert.deepEqual(parseCoords('https://maps.google.com/?q=-23.55,-46.63'), { latitude: -23.55, longitude: -46.63 });
  assert.deepEqual(parseCoords('-23.5505, -46.6333'), { latitude: -23.5505, longitude: -46.6333 });
  assert.equal(parseCoords('Rua sem coordenadas'), null);
});
