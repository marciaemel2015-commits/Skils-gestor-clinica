'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Geradores determinísticos a partir dos dados REAIS da clínica. Não inventam preço, prova,
// depoimento, técnica ou resultado: quando falta dado, o texto traz [A CONFIRMAR] e o item
// aparece como pendência. Todo texto gerado passa pela triagem de conformidade.

const { review, checkText } = require('./compliance');

const PENDENTE = '[A CONFIRMAR]';

function ctx(clinica) {
  const r = clinica.respostas || {};
  const c = r.clinica || {}; const p = r.publico || {}; const a = r.atendimento || {}; const cp = r.campanha || {};
  const proc = cp.procedimento || (c.procedimentos_prioritarios || [])[0] || PENDENTE;
  return {
    nome: c.nome_comercial || PENDENTE,
    cidade: (c.cidade_uf || '').split('/')[0] || PENDENTE,
    bairro: (c.bairros_atendidos || [])[0] || null,
    proc,
    diferencial: c.diferenciais || PENDENTE,
    profissional: c.profissionais || PENDENTE,
    instagram: c.instagram || PENDENTE,
    whatsapp: c.whatsapp || PENDENTE,
    horario: c.horario_funcionamento || PENDENTE,
    desejos: p.desejos || null,
    valoriza: p.valoriza || [],
    objecoes: p.objecoes || [],
    oferta: cp.oferta || null,
    ofertaValidade: cp.oferta_validade || null,
    validadas: c.informacoes_validadas === 'Sim, já validou',
    respostasValidadas: a.respostas_validadas || null,
    temAvaliacao: a.tem_avaliacao || null,
    quemAparece: (r.criativo || {}).quem_aparece || null,
    paleta: (r.criativo || {}).paleta || null,
  };
}

// Campos internos (rótulos, ressalvas para a equipe) não vão ao público e não entram na triagem.
const CAMPOS_INTERNOS = new Set(['angulo', 'tipo', 'limitacoes', 'conceito']);

function withCompliance(item, k) {
  const textos = Object.entries(item).filter(([key, v]) => typeof v === 'string' && !CAMPOS_INTERNOS.has(key)).map(([, v]) => v);
  return { ...item, conformidade: review({ textos, ofertaValidade: k.ofertaValidade, informacoesValidadas: k.validadas ? 'Sim, já validou' : 'Ainda não' }) };
}

// ---------- Copies de anúncio (template copy-anuncio.md) ----------
function copies(clinica, objetivo) {
  const k = ctx(clinica);
  const cta = objetivo === 'whatsapp' ? 'Toque em "Enviar mensagem" e converse com a nossa equipe.' : objetivo === 'seguidores' ? `Siga ${k.instagram} para acompanhar.` : `Conheça a ${k.nome}.`;
  const oferta = k.oferta ? `\n\n${k.oferta}${k.ofertaValidade ? ` (válido até ${k.ofertaValidade.split('-').reverse().join('/')})` : ''}.` : '';
  const valor = k.valoriza[0] ? k.valoriza[0].toLowerCase() : 'cuidado';
  const variantes = [
    {
      angulo: 'Pergunta aberta (identificação sem apontar defeito)',
      titulo: `${k.proc} em ${k.cidade}`,
      textoPrincipal: `Existe algo que você gostaria de cuidar em você neste momento?\n\nNa ${k.nome}, todo atendimento de ${k.proc} começa por uma conversa para entender o que você deseja. ${k.diferencial}.${oferta}\n\n${cta}`,
    },
    {
      angulo: 'Experiência e processo (mecanismo real da clínica)',
      titulo: `${k.proc}: como fazemos na ${k.nome}`,
      textoPrincipal: `Antes de qualquer procedimento, você entende cada etapa.\n\nNa ${k.nome}: ${k.diferencial}. Atendimento com ${k.profissional}.${oferta}\n\n${cta}`,
    },
    {
      angulo: `Valor percebido: ${valor}`,
      titulo: `${k.proc} com foco em ${valor}`,
      textoPrincipal: `Para quem valoriza ${valor}, a escolha da clínica faz diferença.\n\nNa ${k.nome}, em ${k.cidade}, ${k.diferencial.charAt(0).toLowerCase() + k.diferencial.slice(1)}.${oferta}\n\n${cta}`,
    },
    {
      angulo: 'Dúvidas frequentes (educativo)',
      titulo: `Dúvidas sobre ${k.proc}?`,
      textoPrincipal: `Quanto tempo leva? Como é a avaliação? É indicado para mim?\n\nEssas são perguntas que recebemos todos os dias na ${k.nome}. A resposta certa vem de uma avaliação individual com ${k.profissional}.\n\n${cta}`,
    },
  ];
  return variantes.map((v) => withCompliance(v, k));
}

// ---------- Criativo estático (template criativo-estatico.md) ----------
function promptEstatico(clinica, { formato = '1080x1350 (4:5, feed)', angulo } = {}) {
  const k = ctx(clinica);
  const headline = angulo || `${k.proc} na ${k.nome}`;
  const texto = [
    `Crie uma imagem de anúncio para Instagram e Facebook, formato ${formato}.`,
    `Contexto: clínica de estética "${k.nome}" em ${k.cidade}. Procedimento em destaque: ${k.proc}.`,
    `Objetivo da peça: gerar interesse e conversa, sem prometer resultado.`,
    `Composição: profissional${k.quemAparece === 'Ninguém, só o ambiente' ? ' ausente; mostrar apenas o ambiente da clínica (sala de atendimento limpa e organizada)' : ' em ambiente de atendimento real, expressão acolhedora, olhando para a câmera'}. Terço superior com a headline; terço inferior com uma faixa sólida para a chamada.`,
    `Paleta: ${k.paleta || 'tons neutros e claros (off-white, bege, um tom de destaque da marca)'}; alto contraste entre texto e fundo.`,
    `Iluminação: natural e suave, sem filtros que alterem pele ou rosto.`,
    `Tipografia: sem serifa, no máximo 2 pesos; headline grande e legível no celular.`,
    `Texto na imagem (no máximo 2 linhas, sem promessas): "${headline}". Chamada: "Fale com a nossa equipe".`,
    `Proibido: antes e depois, comparação de corpos, pele retocada artificialmente, números ou estatísticas, selos de garantia, logotipos de marcas de terceiros.`,
    `Hierarquia visual: 1) headline, 2) pessoa/ambiente, 3) chamada. Margens de segurança de 10% nas bordas.`,
  ].join('\n');
  return withCompliance({ tipo: 'estatico', headline, prompt: texto }, k);
}

function analiseEstatico(respostas) {
  // Checklist de análise de uma peça existente (respostas: { gancho, hierarquia, copy, oferta, beneficio, cta, contraste, legibilidade, identidade } true/false/null)
  const criterios = ['gancho', 'hierarquia', 'copy', 'oferta', 'beneficio', 'cta', 'paleta', 'contraste', 'legibilidade', 'identidade'];
  const itens = criterios.map((c) => ({ criterio: c, ok: respostas ? respostas[c] ?? null : null }));
  const falhas = itens.filter((i) => i.ok === false).map((i) => i.criterio);
  return { itens, falhas, recomendacao: falhas.length ? `Ajustar primeiro: ${falhas.join(', ')}.` : 'Sem falhas marcadas. Validar com dados de veiculação.' };
}

// ---------- Vídeo (template criativo-video.md) ----------
function roteiroVideo(clinica, { duracao = 30, gancho } = {}) {
  const k = ctx(clinica);
  const g = gancho || `Você sabe o que acontece numa avaliação de ${k.proc}?`;
  const cenas = [
    { tempo: '0–3s', cena: 'Close na profissional, fala direto para a câmera.', fala: g, textoTela: g },
    { tempo: '3–10s', cena: 'Plano médio na sala de atendimento.', fala: `Aqui na ${k.nome}, o primeiro passo é entender o que você deseja.`, textoTela: 'Primeiro: conversa e avaliação' },
    { tempo: '10–20s', cena: 'Detalhes do processo (mãos, materiais, organização), sem mostrar resultado em pessoa.', fala: `${k.diferencial}.`, textoTela: 'Como fazemos' },
    { tempo: '20–26s', cena: 'Profissional de volta ao quadro.', fala: 'Cada pessoa é diferente, por isso a indicação é individual.', textoTela: 'Indicação individual' },
    { tempo: `26–${duracao}s`, cena: 'Fechamento com a logo e o @.', fala: 'Manda uma mensagem e tira suas dúvidas com a gente.', textoTela: `Fale com a equipe • ${k.instagram}` },
  ];
  return withCompliance({
    tipo: 'video', duracao, gancho: g, cenas,
    gravacao: ['Celular na vertical (9:16), câmera traseira, 1080p ou 4K.', 'Luz natural de frente (janela) ou ring light suave; sem filtro de beleza.', 'Áudio: microfone de lapela ou ambiente silencioso.', 'Gravar cada cena 2–3 vezes.'],
    edicao: ['Cortes a cada 2–4 segundos.', 'Legenda em todas as falas (muitas pessoas assistem sem som).', 'Texto na tela dentro da área segura (sem cobrir rosto e sem ficar nas bordas).', 'Sem música com direitos autorais de terceiros; use a biblioteca de áudio da plataforma.'],
    cta: 'Manda uma mensagem e tira suas dúvidas com a gente.',
    roteiroTexto: cenas.map((c) => `${c.tempo} — ${c.fala}`).join(' '),
  }, k);
}

// ---------- Scripts de WhatsApp (template script-whatsapp.md) ----------
function scriptsWhatsapp(clinica) {
  const k = ctx(clinica);
  const respostaClinica = k.validadas && k.respostasValidadas
    ? `Use somente o texto aprovado pela profissional: "${k.respostasValidadas.slice(0, 400)}"`
    : 'Ainda não há respostas aprovadas pela profissional. Responda: "Essa é uma ótima pergunta. Quem orienta isso com segurança é a nossa profissional, na avaliação. Posso verificar um horário para você?"';
  const avaliacao = k.temAvaliacao === 'Sim, gratuita' ? 'uma avaliação sem custo' : k.temAvaliacao === 'Sim, paga' ? 'uma avaliação' : 'um horário';
  const s = {
    primeiroContato: `Oi! Que bom ter você aqui 😊 Aqui é da ${k.nome}. Me conta seu nome e o que você gostaria de saber sobre ${k.proc}?`,
    acolhimento: 'Prazer, [nome]! Fica à vontade para perguntar o que quiser, sem compromisso.',
    entendimento: 'Para eu te orientar melhor: o que te fez pensar em fazer esse procedimento agora? Já fez algo parecido antes?',
    qualificacao: `Você mora ou trabalha perto de ${k.bairro || k.cidade}? E qual seria o melhor dia e período para você?`,
    duvidasClinicas: respostaClinica,
    explicacaoProcedimento: `Aqui na ${k.nome} funciona assim: ${k.diferencial}. Quem faz é ${k.profissional}.`,
    preco: k.oferta ? `O valor hoje é: ${k.oferta}. Antes de fechar qualquer coisa, a profissional confirma se o procedimento é indicado para você.` : 'O valor depende da avaliação, porque cada caso é individual. Posso te passar a faixa de valores e já ver um horário?',
    agendamento: `Tenho ${avaliacao} disponível em [dia] às [hora] ou [dia] às [hora]. Qual fica melhor para você?`,
    confirmacao: `Oi, [nome]! Passando para confirmar seu horário amanhã às [hora] na ${k.nome}. Posso confirmar? Se precisar remarcar, me avisa por aqui.`,
    retomada: `Oi, [nome], tudo bem? Fiquei de te ajudar com informações sobre ${k.proc}. Ainda faz sentido para você? Se preferir, posso te mandar os horários desta semana.`,
    encerramento: 'Tudo certo! Se surgir qualquer dúvida, é só chamar por aqui. Vou deixar seu contato anotado, combinado?',
    registroCrm: 'Depois de cada conversa: atualizar a etapa do contato no CRM (Novo → Em atendimento → Qualificado → Agendado → Compareceu → Venda), procedimento de interesse, objeção principal e próxima ação com data.',
  };
  const regras = [
    'Responder o quanto antes dentro do horário de atendimento.',
    'Nunca diagnosticar, prometer resultado ou dizer que "não dói".',
    'Dúvida sobre saúde, dor, riscos ou recuperação: usar só o texto aprovado pela profissional ou encaminhar para ela.',
    'Sem pressão: sem "últimas vagas" se não for verdade.',
    'Perguntar antes de enviar conteúdo, e respeitar quem pede para não receber mensagens.',
  ];
  return { scripts: s, regras, objeções: respostasObjecoes(clinica), conformidade: review({ textos: Object.values(s), informacoesValidadas: k.validadas ? 'Sim, já validou' : 'Ainda não' }) };
}

// ---------- Biblioteca de objeções (questionario-publico) ----------
const OBJ_BASE = {
  'Medo de sentir dor': { tipo: 'clinica', angulo: 'Conforto e orientação', conteudo: 'Vídeo: "como explicamos o conforto durante o procedimento"' },
  'Medo de ficar artificial': { tipo: 'percepcao', angulo: 'Naturalidade e indicação individual', conteudo: 'Post: "nem todo procedimento é para todo mundo — e tudo bem"' },
  'Quanto tempo dura': { tipo: 'clinica', angulo: 'Expectativa realista', conteudo: 'Story de perguntas: "quanto tempo dura?" respondido pela profissional' },
  'Tempo de recuperação': { tipo: 'clinica', angulo: 'Rotina e cuidados', conteudo: 'Carrossel: "como se planejar para o seu procedimento"' },
  'Se é seguro': { tipo: 'clinica', angulo: 'Segurança e formação', conteudo: 'Vídeo: bastidores de higiene e preparo da sala' },
  'Medo de não gostar do resultado': { tipo: 'percepcao', angulo: 'Avaliação e alinhamento de expectativa', conteudo: 'Vídeo: "o que conversamos antes de qualquer procedimento"' },
  'Opinião do parceiro/família': { tipo: 'percepcao', angulo: 'Autonomia e informação', conteudo: 'Post educativo: "como explicar o procedimento para quem você ama"' },
  'Preço': { tipo: 'comercial', angulo: 'Valor e condições reais', conteudo: 'Story: o que está incluído no atendimento' },
  'Se é indicado para ela': { tipo: 'clinica', angulo: 'Indicação individual', conteudo: 'Reels: "para quem é (e para quem não é) este procedimento"' },
  'Como funciona o atendimento': { tipo: 'processo', angulo: 'Passo a passo da experiência', conteudo: 'Carrossel: "sua primeira visita, do início ao fim"' },
};

function respostasObjecoes(clinica) {
  const k = ctx(clinica);
  return (k.objecoes.length ? k.objecoes : []).map((o) => {
    const base = OBJ_BASE[o] || { tipo: 'outro', angulo: 'Esclarecimento', conteudo: 'Conteúdo de dúvidas frequentes' };
    const resposta = base.tipo === 'clinica'
      ? (k.validadas && k.respostasValidadas ? 'Responder com o texto aprovado pela profissional.' : 'Encaminhar para a profissional: sem resposta aprovada ainda.')
      : base.tipo === 'comercial' ? (k.oferta ? `Apresentar a condição real: ${k.oferta}.` : 'Explicar o que está incluído e oferecer a avaliação.') : `Explicar com calma: ${k.diferencial}.`;
    return { objecao: o, evidencia: 'Informada pela clínica', ...base, resposta, faq: `Pergunta frequente: ${o.toLowerCase()}?`, hipoteseCriativo: `Criativo respondendo "${o}" com o ângulo "${base.angulo}"` };
  });
}

// ---------- Nomes de método (protocolo nomes-de-metodos.md) ----------
function nomesMetodo(clinica, { procedimento, desejo, diferencial, duracao } = {}) {
  const k = ctx(clinica);
  const proc = procedimento || k.proc;
  const dif = diferencial || k.diferencial;
  const des = desejo || k.desejos || 'se sentir bem';
  const curto = proc.split(' ')[0];
  const semAcento = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const praticidade = /rapid|pratic|express|minut|agil/i.test(semAcento(dif + (duracao || '')));
  const naturalidade = /natural|suave|leve|delicad/i.test(semAcento(dif + des));
  const radicais = [
    ...(praticidade ? ['Express', 'Agenda Leve', 'Pausa'] : []),
    ...(naturalidade ? ['Natural', 'Essência', 'Leveza'] : []),
    'Assinatura', 'Ritual', 'Protocolo', 'Jornada', 'Cuidado', 'Equilíbrio', 'Presença', 'Detalhe', 'Momento', 'Sob Medida',
  ];
  // Palavra mais distintiva do nome da clínica (ignora termos genéricos como "Clínica", "Estética").
  const GENERICAS = /^(cl[ií]nica|studio|est[uú]dio|espa[cç]o|centro|instituto|est[eé]tica|de|da|do|das|dos|e|&)$/i;
  const sufixoClinica = (k.nome !== PENDENTE && k.nome.split(/\s+/).find((w) => w.length > 2 && !GENERICAS.test(w))) || '6D';
  const nomes = [];
  const add = (nome, conceito) => { if (!nomes.find((n) => n.nome === nome)) nomes.push({ nome, conceito }); };
  for (const r of radicais) {
    add(`${curto} ${r}`, `${proc} apresentado como "${r.toLowerCase()}": ${dif}`);
    if (nomes.length >= 8) break;
  }
  add(`Método ${sufixoClinica}`, `Nome da própria clínica associado ao processo real: ${dif}`);
  add(`${sufixoClinica} ${curto} Sob Medida`, 'Indicação individual após avaliação');
  add(`Rotina ${curto}`, 'Procedimento integrado ao autocuidado de rotina');
  add(`${curto} Consciente`, 'Escolha informada: a cliente entende cada etapa antes de decidir');
  return nomes.slice(0, 12).map((n) => withCompliance({
    nome: n.nome,
    conceito: n.conceito,
    beneficioComunicado: `Uma experiência de ${proc.toLowerCase()} pensada para quem quer ${des.toLowerCase()}.`,
    diferencialReal: dif,
    headline: `${n.nome}: conheça como funciona`,
    copy: `O ${n.nome} é a forma como a ${k.nome} realiza ${proc.toLowerCase()}: ${dif}. A indicação é individual e começa por uma conversa com ${k.profissional}.`,
    ideiaCriativo: `Vídeo curto mostrando as etapas reais do ${n.nome}, com a profissional explicando cada uma.`,
    roteiro: `0–3s: "Você já ouviu falar do ${n.nome}?" • 3–15s: as etapas reais • 15–25s: para quem é indicado (segundo a profissional) • 25–30s: "Manda uma mensagem para saber se é para você."`,
    cta: 'Manda uma mensagem e conheça o processo.',
    faq: [`O que é o ${n.nome}?`, 'É indicado para mim?', 'Quanto tempo leva o atendimento?', 'Como é a avaliação?'],
    limitacoes: `Não é uma técnica nova nem exclusiva: é o nome do processo real da clínica. Não prometer resultado, duração ou ausência de desconforto. ${duracao ? `Duração informada: ${duracao}.` : 'Duração do atendimento: [A CONFIRMAR].'} Verificar no INPI e nas redes se o nome já é usado por outra empresa antes de adotar.`,
  }, k));
}

// ---------- Treinamento da equipe (template treinamento-equipe.md) ----------
function treinamento(clinica) {
  const k = ctx(clinica);
  const objs = k.objecoes.length ? k.objecoes : ['Preço', 'Como funciona o atendimento'];
  const simulacoes = objs.slice(0, 6).map((o, i) => ({
    numero: i + 1,
    situacao: `Cliente chega pelo anúncio de ${k.proc} e diz: "${frasesObjecao[o] || 'Queria saber mais.'}"`,
    objetivo: 'Acolher, entender a necessidade e conduzir para um horário de avaliação sem pressionar.',
    respostaEsperada: (OBJ_BASE[o] && OBJ_BASE[o].tipo === 'clinica') ? 'Usar a resposta aprovada pela profissional ou encaminhar a dúvida a ela.' : `Explicar com clareza, usando o diferencial real: ${k.diferencial}.`,
  }));
  const criterios = [
    { criterio: 'Tempo de resposta', peso: 2, descricao: 'Respondeu dentro do horário combinado?' },
    { criterio: 'Acolhimento', peso: 2, descricao: 'Chamou pelo nome, foi cordial, sem resposta seca de preço?' },
    { criterio: 'Entendimento', peso: 2, descricao: 'Fez pergunta para entender o que a cliente deseja?' },
    { criterio: 'Clareza', peso: 1, descricao: 'Explicou o processo de forma simples?' },
    { criterio: 'Segurança da informação', peso: 3, descricao: 'Não prometeu resultado, não diagnosticou, encaminhou dúvidas clínicas?' },
    { criterio: 'Condução para agendamento', peso: 2, descricao: 'Ofereceu duas opções de horário?' },
    { criterio: 'Registro no CRM', peso: 1, descricao: 'Atualizou etapa e próxima ação?' },
  ];
  return { modulos: ['1. Primeiro contato e acolhimento', '2. Entender a necessidade', '3. Qualificação', '4. Dúvidas e objeções', '5. Agendamento e confirmação', '6. Retomada de contatos', '7. Registro no CRM'], simulacoes, criterios, notaMaxima: criterios.reduce((s, c) => s + c.peso * 2, 0), escala: '0 = não fez, 1 = fez parcialmente, 2 = fez bem (multiplicado pelo peso)' };
}

const frasesObjecao = {
  'Medo de sentir dor': 'Dói muito?',
  'Medo de ficar artificial': 'Tenho medo de ficar artificial.',
  'Quanto tempo dura': 'Quanto tempo dura?',
  'Tempo de recuperação': 'Vou precisar ficar de repouso?',
  'Se é seguro': 'É seguro?',
  'Medo de não gostar do resultado': 'E se eu não gostar?',
  'Opinião do parceiro/família': 'Preciso ver com meu marido.',
  'Preço': 'Qual o valor?',
  'Se é indicado para ela': 'Será que serve para mim?',
  'Como funciona o atendimento': 'Como funciona?',
};

function avaliarSimulacao(notas) {
  const t = treinamento({ respostas: {} });
  let total = 0; const melhorias = [];
  for (const c of t.criterios) {
    const n = Number(notas[c.criterio]);
    if (![0, 1, 2].includes(n)) throw new Error(`Nota inválida para ${c.criterio}: use 0, 1 ou 2.`);
    total += n * c.peso;
    if (n < 2) melhorias.push(`${c.criterio}: ${c.descricao}`);
  }
  const pct = Math.round((total / t.notaMaxima) * 100);
  return { total, maximo: t.notaMaxima, percentual: pct, nivel: pct >= 85 ? 'Pronta' : pct >= 60 ? 'Em desenvolvimento' : 'Precisa de treino guiado', planoMelhoria: melhorias };
}

module.exports = { copies, promptEstatico, analiseEstatico, roteiroVideo, scriptsWhatsapp, respostasObjecoes, nomesMetodo, treinamento, avaliarSimulacao, checkText, PENDENTE };
