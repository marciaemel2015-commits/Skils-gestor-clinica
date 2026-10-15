'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Verificação de conformidade ANTES de qualquer publicação. É uma triagem automática por regras:
// reduz risco, não garante aprovação. A decisão final é da Meta, e afirmações clínicas sempre
// passam pela profissional responsável. Política vigente: https://transparency.meta.com/policies/ad-standards/

function norm(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// severidade: 'bloqueio' (não publicar assim), 'ajuste' (risco relevante, reescrever), 'verificar' (só se for verdade e comprovável)
const RULES = [
  {
    id: 'garantia', severidade: 'bloqueio', re: /(\bgarant\w*|\b100\s?%|\bresultado certo\b|\bsem erro\b)/,
    explicacao: 'Promete resultado garantido. Procedimentos estéticos variam de pessoa para pessoa e a Meta reprova promessas de resultado.',
    sugestao: 'Troque por algo que descreva a experiência: "avaliação individual para entender o que faz sentido para você".',
  },
  {
    id: 'promessa_absoluta', severidade: 'bloqueio', re: /\b(elimin\w*|acab\w* com|nunca mais|para sempre|definitiv\w*|adeus [a-z]+)\b/,
    explicacao: 'Afirmação absoluta de resultado (eliminar, acabar, para sempre). É promessa clínica sem garantia possível.',
    sugestao: 'Use linguagem de cuidado: "um procedimento pensado para [benefício], com orientação da profissional".',
  },
  {
    id: 'sem_dor', severidade: 'bloqueio', re: /\b(sem dor|indolor|nao doi|zero dor|nada de dor)\b/,
    explicacao: 'Afirma ausência de dor. A sensação varia e só a profissional pode orientar sobre isso.',
    sugestao: 'Use: "tire suas dúvidas sobre conforto e anestesia na avaliação" (somente se a profissional aprovou).',
  },
  {
    id: 'imediato', severidade: 'bloqueio', re: /\b(resultado imediato|na hora|instantane\w*|em \d+ (dias|minutos|horas|sessoes?)|ja na primeira sessao)\b/,
    explicacao: 'Promete prazo de resultado. Prazos variam e precisam de fundamento clínico.',
    sugestao: 'Fale da duração real do atendimento (ex.: "atendimento de cerca de 40 minutos"), se for verdade, e não do prazo de resultado.',
  },
  {
    id: 'linguagem_medica', severidade: 'bloqueio', re: /\b(cura\w*|curar|doenca|diagnostic\w*|trata(r|mento)? (a|o|de) (doenca|acne|melasma|rosacea|flacidez|celulite))\b/,
    explicacao: 'Linguagem de tratamento ou cura de condição de saúde. Isso exige cuidado regulatório e costuma ser reprovado.',
    sugestao: 'Descreva o procedimento e convide para avaliação, sem prometer tratar ou curar.',
  },
  {
    id: 'atributo_pessoal', severidade: 'bloqueio',
    re: /\b(voce (tem|esta|sofre|anda)( com)?|sua (pele|ruga|rugas|flacidez|gordura|celulite|papada|acne|mancha|manchas|olheira|olheiras|barriga)|suas (rugas|manchas|olheiras|estrias)|seu (rosto|corpo|nariz|queixo) (esta|e|ficou))\b/,
    explicacao: 'O anúncio afirma ou insinua uma característica física de quem está lendo. A Meta proíbe anúncios que apontam atributos pessoais.',
    sugestao: 'Pergunte de forma aberta, sem afirmar nada sobre a pessoa: "Existe algo que você gostaria de cuidar na sua rotina de autocuidado?"',
  },
  {
    id: 'inseguranca', severidade: 'bloqueio', re: /\b(feia|feio|vergonha|envelhecid\w*|horrivel|gorda|gordo|defeito|imperfeic\w*|esconder (o|a|seu|sua))\b/,
    explicacao: 'Explora insegurança ou autoimagem negativa. Viola as políticas da Meta e as regras do método.',
    sugestao: 'Fale do desejo positivo (se sentir bem, cuidar de si), sem constranger.',
  },
  {
    id: 'antes_depois', severidade: 'ajuste', re: /\b(antes e depois|antes\/depois|antes x depois|transformacao radical)\b/,
    explicacao: 'Comparações de antes e depois são restritas na Meta e nas regras de publicidade profissional da área de saúde.',
    sugestao: 'Prefira mostrar a experiência, o ambiente e a profissional. Se usar imagem de cliente, só com autorização por escrito e sem exagero.',
  },
  {
    id: 'escassez', severidade: 'verificar', re: /\b(ultimas? vagas?|so hoje|apenas \d+ vagas?|corre|acaba hoje|tempo limitado|vagas limitadas|ultimo dia)\b/,
    explicacao: 'Urgência ou escassez. Só pode ser usada se for real, com data e quantidade verdadeiras.',
    sugestao: 'Informe a condição real e a data de validade (ex.: "condição válida até 30/11"). Sem data real, retire.',
    precisaValidade: true,
  },
  {
    id: 'estatistica', severidade: 'verificar', re: /(\b\d{1,3}\s?%|\bmais de \d+ (clientes|pacientes|atendimentos)|\bmilhares de\b|\baprovad\w* por\b|\bcomprovad\w*\b)/,
    explicacao: 'Número, estatística ou comprovação. Precisa ser verdadeiro e documentado pela clínica.',
    sugestao: 'Mantenha só se a clínica tiver o registro. Caso contrário, retire.',
  },
  {
    id: 'superlativo', severidade: 'verificar', re: /\b(a melhor|o melhor|numero 1|n[ºo°] ?1|unic[oa] (da|na|em)|exclusiv\w*|referencia em)\b/,
    explicacao: 'Afirmação de superioridade ou exclusividade. Precisa de comprovação e pode gerar problema ético-profissional.',
    sugestao: 'Troque por um diferencial concreto e verdadeiro: "avaliação feita pela própria profissional".',
  },
  {
    id: 'gratis', severidade: 'verificar', re: /\b(gratis|gratuit\w*|de graca|sem custo)\b/,
    explicacao: 'Oferta gratuita. Confirme que é real e sem condição escondida.',
    sugestao: 'Deixe claro o que é gratuito e se existe alguma condição.',
  },
  {
    id: 'depoimento', severidade: 'verificar', re: /\b(depoimento|cliente disse|minha paciente|relato real)\b/,
    explicacao: 'Depoimento só pode ser usado se for real e autorizado por escrito. Nunca crie depoimentos.',
    sugestao: 'Confirme a autorização de uso e mantenha as palavras exatas da cliente.',
  },
  {
    id: 'marca_registrada', severidade: 'verificar', re: /\b(botox|restylane|juvederm|ultraformer|sculptra|radiesse)\b/,
    explicacao: 'Nome comercial de produto ou equipamento de terceiros. Verifique se o uso é permitido e se o produto é realmente o utilizado.',
    sugestao: 'Use o nome técnico (ex.: "toxina botulínica") ou confirme que o produto é original e que o uso do nome é permitido.',
  },
];

function checkText(text, contexto = {}) {
  const n = norm(text);
  const itens = [];
  for (const r of RULES) {
    const m = n.match(r.re);
    if (!m) continue;
    let severidade = r.severidade;
    let explicacao = r.explicacao;
    if (r.precisaValidade && !contexto.ofertaValidade) {
      severidade = 'ajuste';
      explicacao += ' Nenhuma data de validade foi cadastrada para esta oferta.';
    }
    itens.push({ regra: r.id, severidade, trecho: m[0], explicacao, sugestao: r.sugestao });
  }
  return itens;
}

// Verificação completa de uma peça/campanha antes da publicação.
function review({ textos = [], oferta, ofertaValidade, idadeMin, quemAparece, autorizacaoImagem, informacoesValidadas, destino } = {}) {
  const itens = [];
  for (const t of textos.filter(Boolean)) {
    for (const it of checkText(t, { ofertaValidade })) itens.push({ ...it, elemento: t.length > 60 ? `${t.slice(0, 60)}…` : t });
  }
  if (oferta && !ofertaValidade) {
    itens.push({ regra: 'oferta_sem_validade', severidade: 'ajuste', elemento: 'Oferta', trecho: oferta, explicacao: 'A oferta não tem data de validade cadastrada. Preço e condição precisam estar atualizados na data da publicação.', sugestao: 'Informe até quando a condição vale.' });
  }
  if (ofertaValidade && new Date(ofertaValidade) < new Date(new Date().toISOString().slice(0, 10))) {
    itens.push({ regra: 'oferta_vencida', severidade: 'bloqueio', elemento: 'Oferta', trecho: ofertaValidade, explicacao: 'A data de validade da oferta já passou.', sugestao: 'Atualize a condição ou retire a oferta do anúncio.' });
  }
  if (idadeMin !== undefined && Number(idadeMin) < 18) {
    itens.push({ regra: 'menor_idade', severidade: 'bloqueio', elemento: 'Público', trecho: String(idadeMin), explicacao: 'Procedimentos estéticos não devem ser anunciados para menores de 18 anos.', sugestao: 'Use idade mínima de 18 anos ou mais.' });
  }
  if (quemAparece === 'Clientes com autorização assinada' && autorizacaoImagem !== 'Sim') {
    itens.push({ regra: 'imagem_sem_autorizacao', severidade: 'bloqueio', elemento: 'Imagem/vídeo', trecho: 'cliente', explicacao: 'Imagem de cliente sem autorização de uso por escrito.', sugestao: 'Obtenha a autorização assinada ou use imagens da profissional/ambiente.' });
  }
  const temAfirmacaoClinica = itens.some((i) => ['sem_dor', 'imediato', 'linguagem_medica'].includes(i.regra));
  if (temAfirmacaoClinica && informacoesValidadas !== 'Sim, já validou') {
    itens.push({ regra: 'afirmacao_nao_validada', severidade: 'bloqueio', elemento: 'Afirmação clínica', trecho: '-', explicacao: 'Há afirmação clínica e a profissional responsável ainda não validou as informações.', sugestao: 'Encaminhe o texto para a profissional responsável aprovar.' });
  }
  if (destino === 'whatsapp' && !textos.some((t) => /whats|mensagem|conversa|agend/i.test(norm(t)))) {
    itens.push({ regra: 'cta_destino', severidade: 'verificar', elemento: 'Chamada para ação', trecho: '-', explicacao: 'O texto não deixa claro que a pessoa vai conversar pelo WhatsApp. Expectativa desalinhada reduz respostas.', sugestao: 'Inclua: "Toque em enviar mensagem e fale com a nossa equipe".' });
  }
  const status = itens.some((i) => i.severidade === 'bloqueio') ? 'bloqueado' : itens.some((i) => i.severidade === 'ajuste') ? 'ajustar' : itens.length ? 'verificar' : 'sem_alertas';
  const mensagens = {
    bloqueado: 'Não publique assim. Há itens com alto risco de reprovação ou de violação das regras.',
    ajustar: 'Recomendamos ajustar antes de publicar.',
    verificar: 'Confirme que as informações marcadas são verdadeiras e comprováveis.',
    sem_alertas: 'Nenhum alerta automático. Isso não garante aprovação: a decisão final é da Meta.',
  };
  return { status, mensagem: mensagens[status], itens, verificadoEm: new Date().toISOString(), aviso: 'Triagem automática por regras. Não substitui a revisão da Meta nem a validação da profissional responsável.' };
}

module.exports = { checkText, review, RULES, norm };
