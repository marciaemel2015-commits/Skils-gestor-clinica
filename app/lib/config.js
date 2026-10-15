'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Configuração central. Nenhum segredo vive aqui: credenciais ficam em secrets/ (cifradas)
// ou em variáveis de ambiente.

const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const config = {
  ROOT,
  DATA_DIR: process.env.M6D_DATA_DIR || path.join(ROOT, 'data'),
  SECRETS_DIR: process.env.M6D_SECRETS_DIR || path.join(ROOT, 'secrets'),
  LOG_DIR: process.env.M6D_LOG_DIR || path.join(ROOT, 'logs'),
  HOST: '127.0.0.1',
  PORT: Number(process.env.M6D_PORT || 4766),
  // Versão da Graph/Marketing API. v26.0 foi lançada em 29/07/2026. Conferir a versão vigente em
  // https://developers.facebook.com/docs/graph-api/changelog/versions antes de cada implantação.
  META_API_VERSION: process.env.META_API_VERSION || 'v26.0',
  META_GRAPH: 'https://graph.facebook.com',
  META_DIALOG: 'https://www.facebook.com',
  // Escopos mínimos para operar campanhas. Revise com o App Review da Meta.
  META_SCOPES: [
    'ads_management',
    'ads_read',
    'business_management',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_ads',
    'instagram_basic',
  ],
  // Metas internas configuráveis para custo por seguidor (não são garantia de desempenho).
  FOLLOWER_COST_DEFAULT: { meta: 1.0, critico: 2.0 },
  METHOD_VERSION: '1.3.0',
  COPYRIGHT:
    '© 2026 — Método Clínica de Estética 6D. Todos os direitos reservados. Método, estrutura, materiais, protocolos e documentação pertencentes à sua titular. Reprodução, distribuição, comercialização, sublicenciamento ou exploração comercial não autorizados são vedados, ressalvadas as permissões concedidas expressamente pela titular e os direitos previstos na legislação aplicável.',
};

module.exports = config;
