'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Assistente de configuração da Meta — dois caminhos:
//   Caminho 1 (já anuncia): conectar → conferir pela API o que existe.
//   Caminho 2 (preparar estrutura): uma pergunta por vez → passo a passo oficial só do que falta →
//   "Já fiz esta etapa" → (se conectado) "Verificar agora pela API".
//
// Limite real da API (não prometer o contrário): o sistema VERIFICA ativos pela API, mas NÃO cria
// perfil, página, Instagram profissional, conexão do WhatsApp nem forma de pagamento — essas etapas
// são feitas pela dona das contas, logada no Facebook dela. Criação de conta de anúncios por API
// existe só para alguns negócios e com limites; o guia usa o caminho manual, que vale para todos.
// Dados de pagamento nunca são pedidos nem guardados; no máximo a API informa SE existe forma de
// pagamento e uma descrição mascarada.

const PASSOS = [
  {
    id: 'perfil',
    pergunta: 'tem_perfil_admin',
    titulo: 'Perfil pessoal no Facebook com acesso de administradora',
    porque: 'A Meta liga página, portfólio empresarial e conta de anúncios a pessoas reais. Quem conecta o sistema precisa ser administradora desses ativos.',
    como: ['Se não tiver perfil: crie em facebook.com com o nome real da dona da clínica e ative a autenticação de dois fatores (Central de Contas › Senha e segurança).', 'Se a página ou a conta de anúncios foram criadas por outra pessoa (ex.: agência), peça para ela adicionar a dona da clínica como administradora em Configurações do negócio › Usuários › Pessoas.'],
    link: 'https://accountscenter.facebook.com/password_and_security',
  },
  {
    id: 'pagina',
    pergunta: 'tem_pagina',
    titulo: 'Página do Facebook da clínica',
    porque: 'Todo anúncio é publicado em nome de uma página.',
    como: ['Entre no Facebook com o perfil pessoal da dona da clínica.', 'Abra o link abaixo, escolha o nome (nome da clínica) e a categoria (ex.: "Centro de estética") e salve.', 'Complete foto, endereço, telefone e horário.'],
    link: 'https://www.facebook.com/pages/create',
  },
  {
    id: 'instagram',
    pergunta: 'tem_instagram_profissional',
    titulo: 'Instagram profissional ligado à página',
    porque: 'Sem o vínculo, os anúncios não aparecem com o @ da clínica e não dá para levar pessoas ao perfil.',
    como: ['No app do Instagram: Configurações › Tipo de conta e ferramentas › Mudar para conta profissional › Empresa.', 'Vincular à página: Configurações do negócio › Contas › Contas do Instagram › Adicionar (ou, na página, Configurações › Contas vinculadas › Instagram).'],
    link: 'https://business.facebook.com/settings/instagram-accounts',
  },
  {
    id: 'bm',
    pergunta: 'tem_bm',
    titulo: 'Portfólio empresarial (antigo Business Manager)',
    porque: 'Organiza página, Instagram, conta de anúncios e pessoas com acesso.',
    como: ['Abra o link abaixo e escolha "Criar portfólio empresarial".', 'Use o nome da clínica e o e-mail comercial.', 'Em Configurações do negócio › Contas › Páginas, adicione a página da clínica.'],
    link: 'https://business.facebook.com/overview',
  },
  {
    id: 'conta_anuncios',
    pergunta: 'tem_conta_anuncios',
    titulo: 'Conta de anúncios',
    porque: 'É onde as campanhas e os gastos ficam registrados.',
    como: ['Configurações do negócio › Contas › Contas de anúncios › Adicionar › Criar nova conta de anúncios (ou selecione uma existente da clínica).', 'Fuso horário: o da cidade da clínica (ex.: América/São Paulo). Moeda: Real (BRL). Fuso e moeda não podem ser alterados depois.', 'Atribua a dona da clínica como administradora da conta.'],
    link: 'https://business.facebook.com/settings/ad-accounts',
  },
  {
    id: 'pagamento',
    pergunta: 'tem_pagamento',
    titulo: 'Forma de pagamento na conta de anúncios',
    porque: 'Sem pagamento, a Meta não entrega anúncios.',
    como: ['A própria dona da clínica cadastra cartão, Pix ou boleto na Central de Cobrança da Meta (link abaixo), escolhendo a conta de anúncios da clínica.', 'O sistema nunca pede nem guarda dados de pagamento.'],
    link: 'https://business.facebook.com/billing_hub/',
  },
  {
    id: 'whatsapp',
    pergunta: 'whatsapp_conectado',
    titulo: 'WhatsApp Business conectado à página',
    porque: 'Para anúncios que abrem conversa no WhatsApp basta o número do WhatsApp (app WhatsApp Business) estar conectado à página. A API oficial do WhatsApp (Cloud API) não é necessária para isso.',
    como: ['No app WhatsApp Business: Configurações › Ferramentas comerciais › Facebook e Instagram › conectar à página.', 'Ou na página: Configurações › WhatsApp › informar o número e confirmar o código recebido.'],
    link: 'https://business.facebook.com/settings/whatsapp-business-accounts',
  },
];

// Significado do status da conta de anúncios (campo account_status da Marketing API).
const ACCOUNT_STATUS = {
  1: 'ativa',
  2: 'desativada pela Meta',
  3: 'com pendência de pagamento',
  7: 'em análise de risco',
  8: 'aguardando acerto de pagamento',
  9: 'em período de carência',
  100: 'em encerramento',
  101: 'encerrada',
  201: 'ativa',
  202: 'encerrada',
};

function statusConta(c) {
  const s = Number(c.account_status);
  return { codigo: s, texto: ACCOUNT_STATUS[s] || `status ${s}`, ativa: s === 1 || s === 201 };
}

// Caminho 2, antes de conectar: o que a gestora diz que já tem.
function guia(respostasMeta = {}) {
  const pend = PASSOS.filter((p) => respostasMeta[p.pergunta] !== 'Sim');
  return {
    pronto: pend.length === 0,
    faltam: pend.map((p) => ({ ...p, resposta: respostasMeta[p.pergunta] || 'não respondido' })),
    jaTem: PASSOS.filter((p) => respostasMeta[p.pergunta] === 'Sim').map((p) => p.titulo),
    proximoPasso: pend.length ? `Criar/conferir: ${pend[0].titulo}` : 'Conectar a Meta ao sistema ("Entrar com Facebook").',
  };
}

// Caminho 1 (e verificação do Caminho 2): conferência real pela API.
// status: ok | falta | verificar (verificar = a API não permitiu confirmar; nunca vira "ok").
async function diagnosticar(client, { selecionado = {} } = {}) {
  const itens = [];
  const add = (id, status, detalhe, extra = {}) => {
    const p = PASSOS.find((x) => x.id === id);
    itens.push({ id, titulo: p ? p.titulo : id, status, detalhe, como: status === 'ok' && !extra.manterComo ? [] : p ? p.como : [], link: p ? p.link : null, ...extra });
  };

  const me = await client.me();
  add('perfil', 'ok', `Conectado como ${me.name || me.id}.`);

  const perms = await client.permissions();
  itens.push({ id: 'permissoes', titulo: 'Permissões concedidas ao sistema', status: perms.ok ? 'ok' : 'falta', detalhe: perms.ok ? `Todas concedidas (${perms.granted.length}).` : `Faltam: ${perms.faltando.join(', ')}${perms.declined.length ? ` (recusadas: ${perms.declined.join(', ')})` : ''}. Clique em "Entrar com Facebook" de novo e marque todas.`, como: [], link: null });

  const safe = async (fn) => { try { return { ok: true, v: await fn() }; } catch (e) { return { ok: false, erro: e.explicacao || e.message }; } };
  const [pg, ct, bm] = await Promise.all([safe(() => client.pages()), safe(() => client.adAccounts()), safe(() => client.businesses())]);
  const pages = pg.ok ? pg.v : []; const contas = ct.ok ? ct.v : [];

  if (!pg.ok) add('pagina', 'verificar', `Não foi possível listar as páginas: ${pg.erro}`);
  else add('pagina', pages.length ? 'ok' : 'falta', pages.length ? `Páginas acessíveis: ${pages.map((p) => p.name).join(', ')}.` : 'Nenhuma página encontrada para este login (ou o login não é administrador da página).', { lista: pages.map((p) => ({ id: p.id, nome: p.name })) });

  const comIg = pages.filter((p) => p.instagram_business_account);
  add('instagram', !pg.ok ? 'verificar' : comIg.length ? 'ok' : pages.length ? 'falta' : 'verificar', comIg.length ? comIg.map((p) => `@${p.instagram_business_account.username || p.instagram_business_account.id} ligado à página ${p.name}`).join('; ') + '.' : 'Nenhuma página com Instagram profissional vinculado.');

  if (!bm.ok) add('bm', 'verificar', `Não foi possível ler os portfólios empresariais: ${bm.erro}`);
  else add('bm', bm.v.length ? 'ok' : 'falta', bm.v.length ? `Portfólios: ${bm.v.map((b) => b.name).join(', ')}.` : 'Nenhum portfólio empresarial encontrado.', { lista: bm.v.map((b) => ({ id: b.id, nome: b.name })) });

  const ativas = contas.filter((c) => statusConta(c).ativa);
  if (!ct.ok) add('conta_anuncios', 'verificar', `Não foi possível listar as contas de anúncios: ${ct.erro}`);
  else add('conta_anuncios', ativas.length ? 'ok' : 'falta', contas.length ? contas.map((c) => `${c.name} (${c.id}) — ${statusConta(c).texto}${c.timezone_name ? `, fuso ${c.timezone_name}` : ''}${c.currency ? `, ${c.currency}` : ''}`).join('; ') + '.' : 'Nenhuma conta de anúncios encontrada.', { lista: contas.map((c) => ({ id: c.id, nome: c.name, status: statusConta(c).texto })) });

  // Pagamento: a API pode dizer SE há forma de pagamento; a confirmação final é sempre no painel oficial.
  const actId = selecionado.adAccountId || (ativas[0] && ativas[0].id);
  if (actId) {
    const f = await client.fundingSource(actId);
    const conf = ' Confirme também na Central de Cobrança (link abaixo) que a forma de pagamento está válida.';
    add('pagamento', f.verificavel ? (f.tem ? 'ok' : 'falta') : 'verificar', (f.verificavel ? (f.tem ? `A API indica forma de pagamento cadastrada${f.descricao ? ` (${f.descricao})` : ''}.` : 'A API não encontrou forma de pagamento na conta.') : 'A API não permitiu confirmar a forma de pagamento.') + conf, { manterComo: true, link: 'https://business.facebook.com/billing_hub/' });
  } else add('pagamento', 'verificar', 'Sem conta de anúncios ativa para verificar.');

  const pageId = selecionado.pageId || (comIg[0] && comIg[0].id) || (pages[0] && pages[0].id);
  if (pageId) {
    const w = await client.pageWhatsapp(pageId);
    add('whatsapp', w.verificavel ? (w.numero ? 'ok' : 'falta') : 'verificar', w.verificavel ? (w.numero ? `Número ligado à página: ${w.numero}.` : 'Nenhum WhatsApp ligado à página.') : 'A API não permitiu confirmar o WhatsApp da página: confira nas configurações da página.');
  } else add('whatsapp', 'verificar', 'Sem página para verificar.');

  const faltas = itens.filter((i) => i.status === 'falta');
  const verificar = itens.filter((i) => i.status === 'verificar');
  return {
    itens,
    pronto: faltas.length === 0,
    resumo: faltas.length ? `Falta: ${faltas.map((f) => f.titulo).join(', ')}.` : verificar.length ? `Tudo o que a API mostra está pronto. Conferir manualmente: ${verificar.map((v) => v.titulo).join(', ')}.` : 'Tudo o que a API consegue verificar está pronto. Confirme o pagamento no painel e siga para a primeira campanha.',
    proximoPasso: faltas.length ? `Resolver: ${faltas[0].titulo}` : 'Escolher conta e página e seguir para "Quero clientes no WhatsApp".',
    verificadoEm: new Date().toISOString(),
  };
}

module.exports = { PASSOS, ACCOUNT_STATUS, statusConta, guia, diagnosticar };
