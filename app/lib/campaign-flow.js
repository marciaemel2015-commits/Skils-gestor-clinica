'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Fluxo de campanha: montar plano → validar → resumo para aprovação → publicar (só com
// confirmação explícita) → registrar o status REAL retornado pela Meta.
// Sempre criado no Gerenciador de Anúncios (Marketing API), nunca pelo botão "Impulsionar".

const { nextMidnight, monitoringDate } = require('./schedule');
const { parseCoords } = require('./geo');
const { review } = require('./compliance');
const { MetaError } = require('./meta');

const CURRENCY_OFFSET = { BRL: 100, USD: 100, EUR: 100, GBP: 100, ARS: 100, CLP: 1, COP: 1, JPY: 1, PYG: 1 };

const OBJETIVO_META = {
  whatsapp: {
    rotulo: 'Clientes no WhatsApp',
    objective: 'OUTCOME_ENGAGEMENT',
    destination_type: 'WHATSAPP',
    optimization_goal: 'CONVERSATIONS',
    billing_event: 'IMPRESSIONS',
    cta: { type: 'WHATSAPP_MESSAGE', value: { app_destination: 'WHATSAPP' } },
    link: 'https://api.whatsapp.com/send',
    validadoNaDocumentacao: true,
  },
  seguidores: {
    rotulo: 'Visitas ao perfil do Instagram (seguidores qualificados)',
    objective: 'OUTCOME_TRAFFIC',
    destination_type: 'INSTAGRAM_PROFILE',
    optimization_goal: 'PROFILE_VISIT',
    billing_event: 'IMPRESSIONS',
    cta: { type: 'VIEW_INSTAGRAM_PROFILE' },
    validadoNaDocumentacao: true,
    observacao: 'A Meta informa que a criação de anúncios de visita ao perfil pela API está em disponibilidade limitada. Se a conta não tiver acesso, o sistema entrega o passo a passo para criar no Gerenciador de Anúncios com os mesmos dados.',
  },
  reconhecimento: {
    rotulo: 'Reconhecimento na região (alcance)',
    objective: 'OUTCOME_AWARENESS',
    destination_type: null,
    optimization_goal: 'REACH',
    billing_event: 'IMPRESSIONS',
    cta: { type: 'LEARN_MORE' },
    validadoNaDocumentacao: true,
  },
};

function mensagemPadrao(procedimento) {
  return `Olá! Vi o anúncio e quero saber mais sobre a avaliação de ${String(procedimento || 'procedimento').toLowerCase()}.`;
}

// Botões fixos: quente (agendar), morna (como funciona), curiosa (saber mais).
// O nome do atendimento ("consulta" ou "avaliação") é escolha da clínica (questionário de atendimento).
function botoesPadrao(nomeAtendimento) {
  const n = String(nomeAtendimento || 'Avaliação').toLowerCase();
  return [`Quero agendar minha ${n}`, `Como funciona a ${n}?`, 'Quero saber mais sobre o procedimento'];
}

function money(v) { return `R$ ${Number(v).toFixed(2).replace('.', ',')}`; }

function genderCode(g) {
  if (g === 'Mulheres') return [2];
  if (g === 'Homens') return [1];
  return undefined; // todos
}

function buildTargeting(r) {
  const c = r.clinica || {}; const p = r.publico || {};
  const coords = parseCoords(c.mapa_coords || c.mapa_link);
  const raio = Number(c.raio_km);
  const t = { age_min: Number(p.idade_min), age_max: Number(p.idade_max), targeting_automation: { advantage_audience: 0 } };
  const g = genderCode(p.genero);
  if (g) t.genders = g;
  if (coords && raio > 0) {
    t.geo_locations = { custom_locations: [{ latitude: coords.latitude, longitude: coords.longitude, radius: raio, distance_unit: 'kilometer' }], location_types: ['home', 'recent'] };
  } else if (Array.isArray(c.cidades_meta) && c.cidades_meta.length) {
    t.geo_locations = { cities: c.cidades_meta.map((k) => ({ key: String(k), radius: Math.max(17, raio || 17), distance_unit: 'kilometer' })), location_types: ['home', 'recent'] };
  }
  return { targeting: t, coords };
}

// Monta o plano completo, sem chamar a API. Retorna também a lista de pendências que impedem publicar.
function buildPlan({ clinica, objetivo, copy, criativo, now = new Date() }) {
  const om = OBJETIVO_META[objetivo];
  if (!om) throw new Error(`Objetivo sem campanha paga: ${objetivo}`);
  const r = clinica.respostas;
  const meta = clinica.meta || {};
  const pend = [];
  const { targeting, coords } = buildTargeting(r);
  if (!targeting.geo_locations) pend.push('Região: falta o link do Google Maps com o ponto da clínica (ou cidades) e o raio em km.');
  if (!(targeting.age_min >= 18)) pend.push('Público: idade mínima precisa ser 18 anos ou mais.');
  if (!(targeting.age_max >= targeting.age_min)) pend.push('Público: idade máxima inválida.');
  const diario = Number((r.campanha && r.campanha.orcamento_diario) || r.clinica.orcamento_diario);
  if (!(diario > 0)) pend.push('Orçamento diário não definido.');
  const limite = Number(r.clinica.limite_mensal);
  if (diario > 0 && limite > 0 && diario * 30.4 > limite) pend.push(`Orçamento: ${money(diario)}/dia ≈ ${money(diario * 30.4)}/mês, acima do limite mensal de ${money(limite)}. Ajuste antes de publicar.`);
  if (!meta.adAccountId) pend.push('Conta de anúncios não selecionada (Configurar Meta).');
  if (!meta.pageId) pend.push('Página do Facebook não selecionada (Configurar Meta).');
  if (!meta.timezone) pend.push('Fuso horário da conta de anúncios desconhecido (Configurar Meta).');
  if (objetivo !== 'whatsapp' && !meta.instagramUserId) pend.push('Perfil do Instagram não vinculado à página selecionada.');
  if (objetivo === 'whatsapp' && !r.clinica.whatsapp) pend.push('WhatsApp comercial não informado.');
  if (!copy || !copy.textoPrincipal) pend.push('Texto do anúncio não definido.');
  if (!criativo || (!criativo.imagemBase64 && !criativo.imageHash && !criativo.instagramMediaId)) pend.push('Criativo não definido (imagem enviada ou post do Instagram).');

  let inicio = null;
  if (meta.timezone) {
    try { inicio = nextMidnight(meta.timezone, now); } catch (e) { pend.push(e.message); }
  }
  const offset = CURRENCY_OFFSET[meta.currency || 'BRL'] || 100;
  const procedimento = (r.campanha && r.campanha.procedimento) || (r.clinica.procedimentos_prioritarios || [])[0] || 'Procedimento';
  const data = (inicio ? inicio.iso.slice(0, 10) : now.toISOString().slice(0, 10));
  const nome = `6D | ${om.rotulo.split(' (')[0]} | ${procedimento} | ${data}`;

  const campaign = { name: nome, objective: om.objective, special_ad_categories: [], status: 'PAUSED' };
  const adset = {
    name: `${nome} | Público ${targeting.age_min}-${targeting.age_max} | ${r.clinica.raio_km || '?'}km`,
    billing_event: om.billing_event,
    optimization_goal: om.optimization_goal,
    bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    daily_budget: diario > 0 ? Math.round(diario * offset) : undefined,
    targeting,
    start_time: inicio ? inicio.iso : undefined,
    status: 'ACTIVE',
    promoted_object: { page_id: meta.pageId || undefined },
  };
  if (om.destination_type) adset.destination_type = om.destination_type;
  if (objetivo === 'whatsapp' && r.clinica.whatsapp) adset.promoted_object.whatsapp_phone_number = `+55${String(r.clinica.whatsapp).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')}`;
  if (objetivo === 'reconhecimento') delete adset.promoted_object;

  const igUser = (r.clinica.instagram || '').replace(/^@/, '').trim();
  let creative;
  if (criativo && criativo.instagramMediaId) {
    creative = { name: `${nome} | criativo`, object_id: meta.pageId, instagram_user_id: meta.instagramUserId, source_instagram_media_id: criativo.instagramMediaId, call_to_action: om.cta };
  } else {
    const link = om.link || (igUser ? `https://www.instagram.com/${igUser}/` : undefined);
    creative = {
      name: `${nome} | criativo`,
      object_story_spec: {
        page_id: meta.pageId,
        ...(meta.instagramUserId ? { instagram_user_id: meta.instagramUserId } : {}),
        link_data: { image_hash: (criativo && criativo.imageHash) || '__UPLOAD__', link, message: copy ? copy.textoPrincipal : '', name: copy ? copy.titulo : '', call_to_action: { ...om.cta, ...(om.link ? {} : { value: { link } }) } },
      },
    };
  }
  // Gatilho do CRM. Padrão: 3 BOTÕES fixos ("perguntas frequentes"/ice breakers) que aparecem
  // quando a cliente abre o WhatsApp pelo anúncio; o texto do botão tocado é enviado e dispara o
  // ramo certo do fluxo no CRM. Alternativa: mensagem já digitada (autofill). A Meta não permite
  // os dois no mesmo anúncio.
  let mensagemInicial = null;
  let botoes = null;
  if (objetivo === 'whatsapp') {
    const saudacao = `Olá! Que bom ter você aqui. Escolha uma opção para falar com a ${r.clinica.nome_comercial || 'clínica'}.`;
    const usarAutofill = copy && copy.mensagemInicial && !(copy.botoes && copy.botoes.length);
    if (usarAutofill) {
      mensagemInicial = String(copy.mensagemInicial).trim();
      if (mensagemInicial.length > 150) pend.push('Mensagem pronta do WhatsApp: use no máximo 150 caracteres.');
    } else {
      botoes = ((copy && copy.botoes) || botoesPadrao((r.atendimento || {}).nome_atendimento)).map((b) => String(b).trim()).filter(Boolean);
      if (botoes.length < 1 || botoes.length > 4) pend.push('Botões do WhatsApp: use de 1 a 4 botões.');
      if (botoes.some((b) => b.length > 80)) pend.push('Botões do WhatsApp: cada botão com no máximo 80 caracteres.');
      if (new Set(botoes.map((b) => b.toLowerCase())).size !== botoes.length) pend.push('Botões do WhatsApp: os textos precisam ser diferentes entre si.');
    }
    if (creative.object_story_spec) {
      creative.object_story_spec.link_data.page_welcome_message = {
        type: 'VISUAL_EDITOR',
        version: 2,
        landing_screen_type: 'welcome_message',
        media_type: 'text',
        text_format: botoes
          ? { customer_action_type: 'ice_breakers', message: { text: saudacao, ice_breakers: botoes.map((title) => ({ title })) } }
          : { customer_action_type: 'autofill_message', message: { text: saudacao, autofill_message: { content: mensagemInicial } } },
      };
    }
  }
  const ad = { name: `${nome} | anúncio`, status: 'ACTIVE' };

  const comp = review({
    textos: [copy && copy.textoPrincipal, copy && copy.titulo, mensagemInicial, ...(botoes || [])],
    oferta: r.campanha && r.campanha.oferta,
    ofertaValidade: r.campanha && r.campanha.oferta_validade,
    idadeMin: targeting.age_min,
    quemAparece: r.criativo && r.criativo.quem_aparece,
    autorizacaoImagem: r.criativo && r.criativo.autorizacao_imagem,
    informacoesValidadas: r.clinica.informacoes_validadas,
    destino: objetivo,
  });
  if (comp.status === 'bloqueado') pend.push('Conformidade: há itens bloqueantes no texto ou no criativo.');

  const resumo = {
    'Objetivo': om.rotulo,
    'Procedimento': procedimento,
    'Conta de anúncios': meta.accountName ? `${meta.accountName} (${meta.adAccountId})` : meta.adAccountId || 'não selecionada',
    'Página / Instagram': `${meta.pageId || '—'} / ${igUser ? '@' + igUser : '—'}`,
    'Destino': objetivo === 'whatsapp' ? `WhatsApp ${r.clinica.whatsapp || '—'}` : objetivo === 'seguidores' ? 'Perfil do Instagram' : 'Alcance na região',
    'Região': coords ? `Raio de ${r.clinica.raio_km} km a partir da clínica (${r.clinica.endereco || r.clinica.cidade_uf || ''})` : 'não definida',
    'Regiões a excluir (conferir manualmente)': (r.clinica.regioes_excluir || []).join(', ') || 'nenhuma',
    'Público': `${r.publico.genero || 'todos'}, ${targeting.age_min}–${targeting.age_max} anos`,
    'Orçamento': diario > 0 ? `${money(diario)} por dia (limite mensal ${limite ? money(limite) : 'não informado'})` : 'não definido',
    'Início': inicio ? `${inicio.dataLocal} às 00:00 (${inicio.fuso})${inicio.aviso ? ' — ' + inicio.aviso : ''}` : 'não calculado',
    'Texto': copy ? copy.textoPrincipal : '—',
    'Título': copy ? copy.titulo : '—',
    ...(botoes ? { 'Botões do WhatsApp (gatilhos do CRM)': `${botoes.map((b) => `"${b}"`).join(' · ')} — cadastre cada frase como gatilho do seu ramo no fluxo do CRM${criativo && criativo.instagramMediaId ? ' (atenção: com post do Instagram como criativo, os botões não são aplicados; configure no Gerenciador)' : ''}` } : {}),
    ...(mensagemInicial ? { 'Mensagem pronta (gatilho do CRM)': `"${mensagemInicial}" — cadastre esta frase como gatilho do fluxo no CRM${criativo && criativo.instagramMediaId ? ' (atenção: com post do Instagram como criativo, a mensagem pronta não é aplicada; confira no Gerenciador)' : ''}` } : {}),
    'Criativo': criativo ? (criativo.instagramMediaId ? `Post do Instagram ${criativo.instagramMediaId}` : criativo.nomeArquivo || 'imagem enviada') : '—',
    'Conformidade': comp.mensagem,
  };
  return {
    objetivo, nome, inicio, procedimento, specs: { campaign, adset, creative, ad }, resumo, conformidade: comp,
    pendencias: pend, podePublicar: pend.length === 0, observacao: om.observacao || null, mensagemInicial, botoes,
    monitoramentoDias: Number((r.campanha && r.campanha.duracao_dias) || 7),
  };
}

function mapEstado(effective, startUnix, nowMs = Date.now()) {
  const e = String(effective || '').toUpperCase();
  if (['PENDING_REVIEW', 'IN_PROCESS', 'PREAPPROVED'].includes(e)) return 'em_revisao';
  if (e === 'DISAPPROVED') return 'reprovada';
  if (e === 'WITH_ISSUES' || e === 'PENDING_BILLING_INFO') return 'com_erro';
  if (e === 'PAUSED' || e === 'CAMPAIGN_PAUSED' || e === 'ADSET_PAUSED') return 'pausada';
  if (e === 'ACTIVE') return startUnix && startUnix * 1000 > nowMs ? 'programada' : 'ativa';
  return e ? e.toLowerCase() : 'desconhecido';
}

// Publica de verdade. Exige confirmação explícita. onStep(registro) é chamado a cada etapa
// para que o histórico seja gravado mesmo se uma etapa posterior falhar.
async function publish({ client, plan, clinica, confirmacao, criativo, onStep = () => {} }) {
  if (confirmacao !== true) throw new Error('Publicação exige confirmação explícita da gestora.');
  if (!plan.podePublicar) throw new Error(`Publicação bloqueada: ${plan.pendencias.join(' | ')}`);
  const act = clinica.meta.adAccountId;
  const ids = {};
  const passos = [];
  const step = async (nome, fn) => {
    try {
      const r = await fn();
      passos.push({ passo: nome, ok: true });
      await onStep({ passo: nome, ok: true, ids: { ...ids } });
      return r;
    } catch (e) {
      const info = e instanceof MetaError ? { codigo: e.code, explicacao: e.explicacao, fbtrace: e.fbtraceId } : { explicacao: e.message };
      passos.push({ passo: nome, ok: false, ...info });
      await onStep({ passo: nome, ok: false, ids: { ...ids }, erro: info });
      const err = new Error(`Falhou em "${nome}": ${info.explicacao}`);
      err.passos = passos; err.ids = ids; err.meta = info;
      throw err;
    }
  };

  // 1. Pré-checagens reais na conta.
  const perms = await step('verificar_permissoes', () => client.permissions());
  if (!perms.granted.includes('ads_management')) {
    const e = new Error('Falta a permissão ads_management. Reconecte a Meta.'); e.passos = passos; throw e;
  }
  const acc = await step('verificar_conta', () => client.account(act));
  if (Number(acc.account_status) !== 1) {
    const e = new Error(`A conta de anúncios não está ativa (status ${acc.account_status}). Verifique no Gerenciador.`); e.passos = passos; throw e;
  }
  // 2. Validação sem criar nada.
  await step('validar_campanha', () => client.createCampaign(act, plan.specs.campaign, { validateOnly: true }));
  // 3. Criar campanha PAUSADA (não gasta nada enquanto o resto é montado).
  const camp = await step('criar_campanha_pausada', () => client.createCampaign(act, plan.specs.campaign));
  ids.campaignId = camp.id;
  // 4. Imagem, se for arquivo novo.
  const creativeSpec = JSON.parse(JSON.stringify(plan.specs.creative));
  if (creativeSpec.object_story_spec && creativeSpec.object_story_spec.link_data.image_hash === '__UPLOAD__') {
    const hash = await step('enviar_imagem', () => client.uploadImage(act, criativo.imagemBase64, criativo.nomeArquivo || 'criativo.jpg'));
    creativeSpec.object_story_spec.link_data.image_hash = hash;
    ids.imageHash = hash;
  }
  const adsetSpec = { ...plan.specs.adset, campaign_id: camp.id };
  await step('validar_conjunto', () => client.createAdSet(act, adsetSpec, { validateOnly: true }));
  const adset = await step('criar_conjunto', () => client.createAdSet(act, adsetSpec));
  ids.adsetId = adset.id;
  const cr = await step('criar_criativo', () => client.createCreative(act, creativeSpec));
  ids.creativeId = cr.id;
  const ad = await step('criar_anuncio', () => client.createAd(act, { ...plan.specs.ad, adset_id: adset.id, creative: { creative_id: cr.id } }));
  ids.adId = ad.id;
  // 5. Ativar a campanha: só entrega a partir do start_time do conjunto.
  await step('ativar_campanha', () => client.setStatus(camp.id, 'ACTIVE'));
  // 6. Ler o status real.
  const st = await step('consultar_status', () => client.status(ad.id));
  const estado = mapEstado(st.effective_status, plan.inicio && plan.inicio.unix);
  return {
    ids, passos, estado, effectiveStatus: st.effective_status, issues: st.issues_info || null,
    proximoMonitoramento: plan.inicio ? monitoringDate(plan.inicio.unix, Math.min(plan.monitoramentoDias, 3), clinica.meta.timezone) : null,
  };
}

module.exports = { buildPlan, publish, mapEstado, OBJETIVO_META, CURRENCY_OFFSET, buildTargeting, mensagemPadrao, botoesPadrao };
