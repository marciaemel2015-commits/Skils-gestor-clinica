'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Definição única das perguntas. A interface, a CLI e os agentes usam esta lista para saber
// o que perguntar, em que ordem, e o que já foi respondido (nunca repetir pergunta respondida).
// Espelha core/forms/*.md — se mudar aqui, atualizar lá.

const Q = [];
function q(form, id, texto, tipo, extra = {}) {
  Q.push({ form, id, texto, tipo, obrigatorio: true, ...extra });
}

// ---------- Questionário da clínica (core/forms/questionario-clinica.md) ----------
q('clinica', 'nome_comercial', 'Qual é o nome da sua clínica, do jeito que as clientes conhecem?', 'texto');
q('clinica', 'unidade', 'Tem mais de uma unidade? Se sim, qual é esta?', 'texto', { obrigatorio: false, ajuda: 'Se for só uma, deixe em branco.' });
q('clinica', 'cidade_uf', 'Em qual cidade e estado fica a clínica?', 'texto', { ajuda: 'Ex.: Campinas/SP' });
q('clinica', 'endereco', 'Qual é o endereço da clínica (rua e bairro)?', 'texto', { ajuda: 'Usado só para definir a área do anúncio. Não aparece no anúncio.' });
q('clinica', 'mapa_link', 'Cole o link do Google Maps da sua clínica.', 'mapa', { ajuda: 'Abra o Google Maps, procure a clínica, toque em Compartilhar e cole o link aqui. Usamos para marcar o ponto central do anúncio.' });
q('clinica', 'instagram', 'Qual é o @ do Instagram da clínica?', 'texto');
q('clinica', 'whatsapp', 'Qual é o WhatsApp comercial que vai receber as clientes?', 'telefone', { ajuda: 'Com DDD. Ex.: (19) 99999-0000' });
q('clinica', 'site', 'Tem site? Cole o endereço.', 'texto', { obrigatorio: false });
q('clinica', 'crm', 'Onde vocês anotam os contatos e agendamentos hoje?', 'opcao', { opcoes: ['Caderno ou agenda de papel', 'Planilha', 'Sistema de agenda da clínica', 'Só no WhatsApp', 'Vou usar o CRM deste sistema'] });
q('clinica', 'pasta_criativos', 'Tem uma pasta com fotos e vídeos da clínica? Cole o link.', 'texto', { obrigatorio: false });
q('clinica', 'cidades_atendidas', 'Quais cidades suas clientes costumam vir?', 'lista', { ajuda: 'Separe por vírgula.' });
q('clinica', 'bairros_atendidos', 'Algum bairro em especial que vocês querem atingir?', 'lista', { obrigatorio: false });
q('clinica', 'raio_km', 'Até quantos quilômetros da clínica uma cliente costuma vir?', 'opcao', { opcoes: ['3', '5', '8', '10', '15', '20', '30'], ajuda: 'Em capital, raios menores costumam funcionar. No interior, inclua cidades vizinhas. Você pode mudar depois.' });
q('clinica', 'local_atendimento', 'Vocês atendem só na clínica?', 'opcao', { opcoes: ['Só na clínica', 'Na clínica e em domicílio', 'Em mais de um endereço'] });
q('clinica', 'regioes_excluir', 'Tem alguma região que NÃO deve receber o anúncio?', 'lista', { obrigatorio: false });
q('clinica', 'procedimentos', 'Quais procedimentos vocês oferecem?', 'lista');
q('clinica', 'procedimentos_prioritarios', 'Quais procedimentos você quer vender mais agora?', 'lista');
q('clinica', 'precos', 'Qual é o preço real de cada procedimento prioritário?', 'texto', { ajuda: 'Ex.: Botox R$ 1.200; Limpeza de pele R$ 180. Use o preço que vocês cobram de verdade.' });
q('clinica', 'condicoes_comerciais', 'Existe alguma condição comercial real hoje (parcelamento, pacote, avaliação)?', 'texto', { obrigatorio: false });
q('clinica', 'diferenciais', 'O que a sua clínica faz de diferente, de verdade, nesses procedimentos?', 'texto', { ajuda: 'Algo que vocês realmente fazem: uma etapa de avaliação, um cuidado no pós, o tempo dedicado. Não precisa ser exclusivo.' });
q('clinica', 'capacidade_semana', 'Quantas clientes novas vocês conseguem atender por semana?', 'numero');
q('clinica', 'profissionais', 'Quem realiza os procedimentos? (nome e formação)', 'texto');
q('clinica', 'informacoes_validadas', 'A profissional responsável já validou as informações sobre dor, recuperação, duração e riscos que podemos usar?', 'opcao', { opcoes: ['Sim, já validou', 'Ainda não'], ajuda: 'Sem essa validação, o sistema não usa nenhuma afirmação clínica nos anúncios nem no atendimento.' });
q('clinica', 'orcamento_diario', 'Quanto você quer investir por dia em anúncios? (R$)', 'moeda');
q('clinica', 'limite_mensal', 'Qual é o limite máximo por mês? (R$)', 'moeda');
q('clinica', 'horario_funcionamento', 'Qual é o horário de atendimento?', 'texto', { ajuda: 'Ex.: seg a sex 9h–19h, sáb 9h–13h' });
q('clinica', 'quem_responde', 'Quem responde o WhatsApp?', 'opcao', { opcoes: ['Eu mesma', 'Secretária/recepção', 'Mais de uma pessoa', 'Atendimento automático + pessoa'] });
q('clinica', 'tempo_resposta', 'Em quanto tempo vocês costumam responder uma mensagem nova?', 'opcao', { obrigatorio: false, opcoes: ['Até 5 minutos', 'Até 30 minutos', 'Até 2 horas', 'No mesmo dia', 'Não sei'] });
q('clinica', 'vendas_periodo', 'Quantos procedimentos vocês vendem por mês, mais ou menos?', 'texto', { obrigatorio: false, ajuda: 'Se não souber, deixe em branco. Não vamos inventar.' });

// ---------- Público (core/forms/questionario-publico.md) ----------
q('publico', 'genero', 'A clínica atende quem?', 'opcao', { opcoes: ['Mulheres', 'Homens', 'Mulheres e homens'] });
q('publico', 'idade_min', 'Qual a idade mínima das clientes que mais fazem esses procedimentos?', 'opcao', { opcoes: ['18', '21', '25', '30', '35', '40', '45'] });
q('publico', 'idade_max', 'E a idade máxima?', 'opcao', { opcoes: ['35', '40', '45', '50', '55', '60', '65'] });
q('publico', 'desejos', 'O que as clientes dizem que querem alcançar?', 'texto', { ajuda: 'Use as palavras delas, como aparecem no WhatsApp ou Instagram.' });
q('publico', 'valoriza', 'O que elas mais valorizam num procedimento?', 'multi', { opcoes: ['Naturalidade', 'Segurança', 'Praticidade/pouco tempo', 'Preço', 'Atendimento acolhedor', 'Experiência da profissional', 'Resultado duradouro'] });
q('publico', 'objecoes', 'Quais dúvidas ou receios aparecem antes de agendar?', 'multi', {
  opcoes: ['Medo de sentir dor', 'Medo de ficar artificial', 'Quanto tempo dura', 'Tempo de recuperação', 'Se é seguro', 'Medo de não gostar do resultado', 'Opinião do parceiro/família', 'Preço', 'Se é indicado para ela', 'Como funciona o atendimento'],
  ajuda: 'Marque só o que você já ouviu de clientes reais.',
});
q('publico', 'perguntas_whatsapp', 'Quais perguntas chegam mais no WhatsApp?', 'texto', { obrigatorio: false });
q('publico', 'perguntas_instagram', 'Quais dúvidas aparecem nos comentários e direct?', 'texto', { obrigatorio: false });
q('publico', 'ja_tentou', 'O que elas já tentaram antes de chegar até vocês?', 'texto', { obrigatorio: false });
q('publico', 'abordagens_que_agendam', 'Que tipo de conversa costuma terminar em agendamento?', 'texto', { obrigatorio: false });
q('publico', 'motivos_desistencia', 'Por que algumas pessoas desistem?', 'texto', { obrigatorio: false });
q('publico', 'perfil_que_comparece', 'Que tipo de cliente costuma agendar e aparecer?', 'texto', { obrigatorio: false });

// ---------- Campanha (core/forms/questionario-campanha.md) ----------
q('campanha', 'procedimento', 'Qual procedimento esta campanha vai divulgar?', 'opcao_dinamica', { fonte: 'clinica.procedimentos_prioritarios' });
q('campanha', 'oferta', 'Vai divulgar preço ou condição? Qual, exatamente?', 'texto', { obrigatorio: false, ajuda: 'Só condição real e válida. Deixe em branco para não divulgar preço.' });
q('campanha', 'oferta_validade', 'Até quando essa condição vale?', 'data', { obrigatorio: false });
q('campanha', 'orcamento_diario', 'Quanto investir por dia nesta campanha? (R$)', 'moeda', { padrao: 'clinica.orcamento_diario' });
q('campanha', 'duracao_dias', 'Por quantos dias, no mínimo, você quer deixar rodando antes de avaliar?', 'opcao', { opcoes: ['5', '7', '10', '14'], ajuda: 'Avaliar cedo demais leva a decisões erradas.' });

// ---------- Criativo (core/forms/questionario-criativo.md) ----------
q('criativo', 'tem_criativo', 'Você já tem um criativo (foto ou vídeo) para usar?', 'opcao', { opcoes: ['Sim, tenho o arquivo', 'Tenho um post no Instagram que foi bem', 'Não, quero criar do zero', 'Quero modelar um anúncio que vi'] });
q('criativo', 'formato', 'Que formato?', 'opcao', { opcoes: ['Imagem', 'Carrossel', 'Vídeo'] });
q('criativo', 'referencia', 'Tem algum anúncio ou vídeo de referência? Cole o link.', 'texto', { obrigatorio: false });
q('criativo', 'referencia_dados', 'Esse material de referência tem resultado comprovado (vendas, agendamentos, muitos seguidores)?', 'opcao', { obrigatorio: false, opcoes: ['Sim, tenho os números', 'Foi bem no orgânico', 'Não sei, só gostei', 'É de outra clínica'] });
q('criativo', 'modelar_ou_zero', 'Quer modelar a ideia ou criar do zero?', 'opcao', { opcoes: ['Modelar uma referência', 'Criar do zero'] });
q('criativo', 'paleta', 'Quais são as cores da clínica?', 'texto', { obrigatorio: false });
q('criativo', 'quem_aparece', 'Quem pode aparecer no vídeo ou foto?', 'opcao', { opcoes: ['A profissional', 'A equipe', 'Clientes com autorização assinada', 'Ninguém, só o ambiente'] });
q('criativo', 'autorizacao_imagem', 'Se aparecer cliente: existe autorização de uso de imagem por escrito?', 'opcao', { opcoes: ['Sim', 'Não', 'Não vai aparecer cliente'] });

// ---------- Atendimento (core/forms/questionario-atendimento.md) ----------
q('atendimento', 'primeira_mensagem', 'Como vocês respondem hoje a primeira mensagem? Cole um exemplo.', 'texto', { obrigatorio: false });
q('atendimento', 'perguntas_qualificacao', 'O que vocês precisam saber antes de agendar uma avaliação?', 'multi', { opcoes: ['Procedimento de interesse', 'Se já fez antes', 'Melhor dia e horário', 'Cidade/bairro', 'Se tem alguma dúvida de saúde (encaminhar à profissional)'] });
q('atendimento', 'nome_atendimento', 'Como a clínica chama o primeiro atendimento com a Doutora?', 'opcao', { obrigatorio: false, opcoes: ['Consulta', 'Avaliação'], ajuda: '"Consulta" posiciona como atendimento completo e costuma ser usada quando é paga e conduzida pela profissional habilitada. "Avaliação" pode soar como orçamento rápido. A escolha muda os botões do anúncio e as mensagens.' });
q('atendimento', 'tem_avaliacao','A clínica faz avaliação antes do procedimento?', 'opcao', { opcoes: ['Sim, gratuita', 'Sim, paga', 'Não'] });
q('atendimento', 'confirma_agendamento', 'Vocês confirmam o agendamento na véspera?', 'opcao', { opcoes: ['Sim, sempre', 'Às vezes', 'Não'] });
q('atendimento', 'respostas_validadas', 'Cole as respostas que a profissional aprovou para dor, recuperação, duração e cuidados.', 'texto', { obrigatorio: false, ajuda: 'O sistema só usa essas respostas. Sem elas, o script orienta a encaminhar a dúvida para a profissional.' });
q('atendimento', 'dificuldades', 'Onde o atendimento mais trava hoje?', 'multi', { opcoes: ['Demora para responder', 'Cliente some depois do preço', 'Não sabe explicar o procedimento', 'Falta confirmação', 'Muitas faltas', 'Não registra os contatos'] });

// ---------- Ponto de partida da Meta (core/forms/questionario-meta.md) ----------
const SNN = ['Sim', 'Não', 'Não sei'];
q('meta', 'ja_anuncia', 'A clínica já anuncia pelo Gerenciador de Anúncios (com conta e pagamento configurados)?', 'opcao', { opcoes: SNN, ajuda: 'Se sim, vamos direto conectar e conferir. Se não, mostramos o passo a passo do que falta.' });
q('meta', 'tem_perfil_admin', 'A dona da clínica tem perfil pessoal no Facebook e é administradora das contas da clínica?', 'opcao', { opcoes: SNN, ajuda: 'Página, portfólio empresarial e conta de anúncios ficam ligados a um perfil pessoal real, com acesso de administradora.' });
q('meta', 'tem_pagina','A clínica tem página no Facebook?', 'opcao', { opcoes: SNN });
q('meta', 'tem_instagram_profissional', 'O Instagram da clínica é profissional e está ligado à página?', 'opcao', { opcoes: SNN });
q('meta', 'tem_bm', 'Existe um portfólio empresarial (Business Manager) da clínica?', 'opcao', { opcoes: SNN });
q('meta', 'tem_conta_anuncios', 'Existe uma conta de anúncios da clínica?', 'opcao', { opcoes: SNN });
q('meta', 'tem_pagamento', 'A conta de anúncios já tem forma de pagamento cadastrada?', 'opcao', { opcoes: SNN, ajuda: 'O cadastro do pagamento é sempre feito pela dona da clínica, na Central de Cobrança da Meta.' });
q('meta', 'whatsapp_conectado', 'O WhatsApp Business da clínica está conectado à página?', 'opcao', { opcoes: SNN });

// ---------- Necessidades por objetivo ----------
const OBJETIVOS = {
  whatsapp: {
    titulo: 'Quero clientes no WhatsApp',
    pilares: ['D1', 'D3', 'D4', 'D5'],
    protocolo: 'core/protocols/whatsapp-conversao.md',
    precisa: ['clinica.nome_comercial', 'clinica.cidade_uf', 'clinica.mapa_link', 'clinica.raio_km', 'clinica.whatsapp', 'clinica.procedimentos_prioritarios', 'clinica.precos', 'clinica.diferenciais', 'clinica.capacidade_semana', 'clinica.informacoes_validadas', 'clinica.orcamento_diario', 'clinica.limite_mensal', 'clinica.quem_responde', 'publico.genero', 'publico.idade_min', 'publico.idade_max', 'publico.objecoes', 'campanha.procedimento', 'campanha.orcamento_diario', 'campanha.duracao_dias', 'criativo.tem_criativo', 'criativo.formato'],
    campanha: true,
  },
  seguidores: {
    titulo: 'Quero seguidores qualificados no Instagram',
    pilares: ['D1', 'D3', 'D4', 'D6'],
    protocolo: 'core/protocols/seguidores-instagram.md',
    precisa: ['clinica.nome_comercial', 'clinica.cidade_uf', 'clinica.mapa_link', 'clinica.raio_km', 'clinica.instagram', 'clinica.procedimentos_prioritarios', 'clinica.diferenciais', 'clinica.orcamento_diario', 'clinica.limite_mensal', 'publico.genero', 'publico.idade_min', 'publico.idade_max', 'publico.desejos', 'campanha.procedimento', 'campanha.orcamento_diario', 'campanha.duracao_dias', 'criativo.tem_criativo', 'criativo.formato'],
    campanha: true,
  },
  reconhecimento: {
    titulo: 'Quero ser reconhecida na minha região',
    pilares: ['D1', 'D3', 'D4'],
    protocolo: 'core/protocols/reconhecimento-local.md',
    precisa: ['clinica.nome_comercial', 'clinica.cidade_uf', 'clinica.mapa_link', 'clinica.raio_km', 'clinica.instagram', 'clinica.diferenciais', 'clinica.profissionais', 'clinica.orcamento_diario', 'clinica.limite_mensal', 'publico.genero', 'publico.idade_min', 'publico.idade_max', 'campanha.procedimento', 'campanha.orcamento_diario', 'campanha.duracao_dias', 'criativo.tem_criativo', 'criativo.formato', 'criativo.quem_aparece'],
    campanha: true,
  },
  criativo: {
    titulo: 'Quero criar ou aproveitar um criativo',
    pilares: ['D2', 'D4'],
    protocolo: 'core/agents/criativo.md',
    precisa: ['clinica.nome_comercial', 'clinica.procedimentos_prioritarios', 'clinica.diferenciais', 'clinica.informacoes_validadas', 'publico.desejos', 'publico.objecoes', 'criativo.tem_criativo', 'criativo.formato', 'criativo.modelar_ou_zero', 'criativo.quem_aparece', 'criativo.autorizacao_imagem'],
  },
  modelar: {
    titulo: 'Quero modelar um anúncio',
    pilares: ['D2', 'D4'],
    protocolo: 'core/agents/criativo.md',
    precisa: ['clinica.nome_comercial', 'clinica.procedimentos_prioritarios', 'clinica.diferenciais', 'publico.objecoes', 'criativo.referencia', 'criativo.referencia_dados', 'criativo.formato'],
  },
  monitorar: { titulo: 'Quero monitorar minhas campanhas', pilares: ['D6'], protocolo: 'core/protocols/monitoramento.md', precisa: ['clinica.nome_comercial'] },
  otimizar: { titulo: 'Quero otimizar resultados', pilares: ['D6'], protocolo: 'core/protocols/validacao-e-escala.md', precisa: ['clinica.nome_comercial', 'clinica.orcamento_diario', 'clinica.limite_mensal', 'clinica.capacidade_semana'] },
  treinar: {
    titulo: 'Quero melhorar o atendimento e treinar minha equipe',
    pilares: ['D5'],
    protocolo: 'core/agents/atendimento.md',
    precisa: ['clinica.nome_comercial', 'clinica.procedimentos_prioritarios', 'clinica.diferenciais', 'clinica.quem_responde', 'clinica.horario_funcionamento', 'clinica.informacoes_validadas', 'publico.objecoes', 'atendimento.perguntas_qualificacao', 'atendimento.tem_avaliacao', 'atendimento.confirma_agendamento', 'atendimento.dificuldades'],
  },
  metodo: {
    titulo: 'Quero criar um nome de método para um procedimento',
    pilares: ['D4'],
    protocolo: 'core/protocols/nomes-de-metodos.md',
    precisa: ['clinica.nome_comercial', 'clinica.procedimentos_prioritarios', 'clinica.diferenciais', 'clinica.informacoes_validadas', 'publico.desejos', 'publico.valoriza'],
  },
  historico: { titulo: 'Quero consultar o histórico', pilares: ['D6'], protocolo: 'core/protocols/monitoramento.md', precisa: [] },
  crm: { titulo: 'Retomar contatos e organizar o CRM', pilares: ['D5', 'D6'], protocolo: 'core/protocols/crm-e-rastreamento.md', precisa: ['clinica.nome_comercial'] },
  meta: { titulo: 'Configurar a integração com a Meta', pilares: ['D3'], protocolo: 'docs/CONFIGURACAO-META.md', precisa: ['meta.ja_anuncia'] },
  meta_ativos: { titulo: 'Preparar página, Instagram, BM, conta de anúncios e WhatsApp', pilares: ['D3'], protocolo: 'docs/CONFIGURACAO-META.md', precisa: ['meta.tem_perfil_admin', 'meta.tem_pagina', 'meta.tem_instagram_profissional', 'meta.tem_bm', 'meta.tem_conta_anuncios', 'meta.tem_pagamento', 'meta.whatsapp_conectado'] },
};

function getQuestion(ref) {
  const [form, id] = ref.split('.');
  return Q.find((x) => x.form === form && x.id === id);
}

function isAnswered(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Retorna as perguntas que faltam para um objetivo, na ordem, sem repetir as respondidas.
function missingFor(objetivo, respostas, { incluirOpcionais = false } = {}) {
  const def = OBJETIVOS[objetivo];
  if (!def) throw new Error(`Objetivo desconhecido: ${objetivo}`);
  const out = [];
  for (const ref of def.precisa) {
    const qq = getQuestion(ref);
    if (!qq) throw new Error(`Pergunta não cadastrada: ${ref}`);
    const [form, id] = ref.split('.');
    const v = respostas && respostas[form] ? respostas[form][id] : undefined;
    if (!isAnswered(v) && (qq.obrigatorio || incluirOpcionais)) out.push({ ...qq, ref });
  }
  return out;
}

function formQuestions(form) {
  return Q.filter((x) => x.form === form).map((x) => ({ ...x, ref: `${x.form}.${x.id}` }));
}

function validateAnswer(question, value) {
  if (!isAnswered(value)) return question.obrigatorio ? 'Esta resposta é necessária para continuar.' : null;
  switch (question.tipo) {
    case 'numero':
    case 'moeda': {
      const n = Number(String(value).replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(n) || n < 0) return 'Digite um número válido.';
      return null;
    }
    case 'telefone': {
      const d = String(value).replace(/\D/g, '');
      if (d.length < 10 || d.length > 13) return 'Digite o número com DDD.';
      return null;
    }
    case 'opcao':
      if (question.opcoes && !question.opcoes.includes(String(value))) return 'Escolha uma das opções.';
      return null;
    case 'multi':
      if (!Array.isArray(value)) return 'Escolha pelo menos uma opção.';
      return null;
    default:
      return null;
  }
}

function normalizeAnswer(question, value) {
  if (!isAnswered(value)) return value;
  if (question.tipo === 'numero' || question.tipo === 'moeda') return Number(String(value).replace(/\./g, '').replace(',', '.'));
  if (question.tipo === 'lista' && typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string') return value.trim();
  return value;
}

module.exports = { QUESTIONS: Q, OBJETIVOS, getQuestion, missingFor, formQuestions, validateAnswer, normalizeAnswer, isAnswered };
