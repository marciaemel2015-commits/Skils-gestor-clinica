'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Cliente da Graph/Marketing API da Meta. Faz chamadas reais; nada aqui simula resultado.
// Testes injetam um fetch simulado (identificado como SIMULAÇÃO nos testes).
// Referência: https://developers.facebook.com/docs/marketing-api

const crypto = require('crypto');
const config = require('./config');
const { redactString } = require('./redact');

class MetaError extends Error {
  constructor({ message, code, subcode, type, status, userTitle, userMsg, fbtraceId, rede }) {
    super(message);
    this.name = 'MetaError';
    Object.assign(this, { code, subcode, type, status, userTitle, userMsg, fbtraceId, rede: !!rede });
    this.explicacao = explain(this);
  }
}

// Tradução dos erros mais comuns para linguagem simples.
function explain(e) {
  if (e.rede) return 'Não foi possível falar com a Meta (sem internet ou serviço fora do ar). Nada foi alterado. Tente de novo em alguns minutos.';
  const c = Number(e.code);
  if (c === 190) return 'O acesso à Meta expirou ou foi revogado. Conecte a Meta novamente em "Configurar Meta".';
  if (c === 10 || (c >= 200 && c < 300)) return 'Falta permissão para esta ação. Reconecte a Meta autorizando todas as permissões pedidas, e confira se você é administradora da conta de anúncios e da página.';
  if ([4, 17, 32, 613, 80000, 80003, 80004].includes(c)) return 'Limite de chamadas da Meta atingido. Aguarde alguns minutos antes de tentar de novo.';
  if (c === 2635) return 'A versão da API configurada foi descontinuada. Atualize META_API_VERSION.';
  if (c === 100) return `A Meta recusou um dos parâmetros: ${e.userMsg || e.message}`;
  if (c === 1487) return 'A conta de anúncios está com restrição. Verifique pagamentos e qualidade da conta no Gerenciador de Anúncios.';
  if (e.userMsg) return e.userMsg;
  return `A Meta retornou um erro: ${e.message}`;
}

function encodeParams(params) {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null) continue;
    out.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  return out;
}

class MetaClient {
  constructor({ token, appSecret = null, version = config.META_API_VERSION, fetchImpl = globalThis.fetch, base = config.META_GRAPH } = {}) {
    if (!token) throw new MetaError({ message: 'sem token', code: 190 });
    this.token = token;
    this.appSecret = appSecret;
    this.version = version;
    this.fetch = fetchImpl;
    this.base = base;
  }

  authParams() {
    const p = { access_token: this.token };
    if (this.appSecret) p.appsecret_proof = crypto.createHmac('sha256', this.appSecret).update(this.token).digest('hex');
    return p;
  }

  async request(method, path, params = {}) {
    const url = new URL(`${this.base}/${this.version}/${path.replace(/^\//, '')}`);
    const all = { ...params, ...this.authParams() };
    let res;
    try {
      if (method === 'GET') {
        url.search = encodeParams(all).toString();
        res = await this.fetch(url.toString(), { method });
      } else {
        res = await this.fetch(url.toString(), { method, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encodeParams(all).toString() });
      }
    } catch (e) {
      throw new MetaError({ message: redactString(e.message), rede: true });
    }
    let body;
    try { body = await res.json(); } catch (_) { body = null; }
    if (!res.ok || (body && body.error)) {
      const er = (body && body.error) || {};
      throw new MetaError({
        message: redactString(er.message || `HTTP ${res.status}`), code: er.code, subcode: er.error_subcode, type: er.type,
        status: res.status, userTitle: er.error_user_title, userMsg: er.error_user_msg, fbtraceId: er.fbtrace_id,
      });
    }
    return body;
  }

  get(path, params) { return this.request('GET', path, params); }
  post(path, params) { return this.request('POST', path, params); }

  // ---------- Leitura ----------
  me() { return this.get('me', { fields: 'id,name' }); }

  async permissions() {
    const r = await this.get('me/permissions');
    const granted = []; const declined = [];
    for (const p of r.data || []) (p.status === 'granted' ? granted : declined).push(p.permission);
    const faltando = config.META_SCOPES.filter((s) => !granted.includes(s));
    return { granted, declined, faltando, ok: faltando.length === 0 };
  }

  async adAccounts() {
    const r = await this.get('me/adaccounts', { fields: 'id,account_id,name,account_status,currency,timezone_name,timezone_offset_hours_utc,disable_reason', limit: 100 });
    return r.data || [];
  }

  account(actId) {
    return this.get(actId, { fields: 'id,account_id,name,account_status,currency,timezone_name,timezone_offset_hours_utc,disable_reason,amount_spent,spend_cap' });
  }

  async pages() {
    const r = await this.get('me/accounts', { fields: 'id,name,instagram_business_account{id,username},tasks', limit: 100 });
    return r.data || [];
  }

  async searchCity(q) {
    const r = await this.get('search', { type: 'adgeolocation', location_types: ['city'], q, limit: 10 });
    return r.data || [];
  }

  async campaigns(actId) {
    const r = await this.get(`${actId}/campaigns`, { fields: 'id,name,objective,status,effective_status,daily_budget,start_time,created_time', limit: 100 });
    return r.data || [];
  }

  async insights(objectId, { level = 'ad', datePreset = 'maximum', since, until } = {}) {
    const params = {
      level,
      fields: 'campaign_id,campaign_name,adset_id,ad_id,ad_name,spend,impressions,reach,cpm,frequency,ctr,cpc,clicks,actions,cost_per_action_type,date_start,date_stop',
      limit: 200,
    };
    if (since && until) params.time_range = { since, until }; else params.date_preset = datePreset;
    const r = await this.get(`${objectId}/insights`, params);
    return r.data || [];
  }

  async businesses() {
    const r = await this.get('me/businesses', { fields: 'id,name,verification_status', limit: 50 });
    return r.data || [];
  }

  // Forma de pagamento: lida separadamente porque o campo pode não estar disponível para todos os
  // perfis de acesso. Retorna null quando não for possível verificar (não confundir com "não tem").
  async fundingSource(actId) {
    try {
      const r = await this.get(actId, { fields: 'funding_source,funding_source_details' });
      return { verificavel: true, tem: !!(r.funding_source || (r.funding_source_details && r.funding_source_details.id)), descricao: r.funding_source_details ? r.funding_source_details.display_string || null : null };
    } catch (e) {
      return { verificavel: false, tem: null, motivo: e.explicacao || e.message };
    }
  }

  // WhatsApp ligado à página: idem — se o campo não puder ser lido, a verificação fica manual.
  async pageWhatsapp(pageId) {
    try {
      const r = await this.get(pageId, { fields: 'whatsapp_number' });
      return { verificavel: true, numero: r.whatsapp_number || null };
    } catch (e) {
      return { verificavel: false, numero: null, motivo: e.explicacao || e.message };
    }
  }

  status(objectId) {
    return this.get(objectId, { fields: 'id,name,status,effective_status,configured_status,issues_info,ad_review_feedback' });
  }

  // ---------- Escrita (só chamada pelo fluxo de publicação, após confirmação) ----------
  createCampaign(actId, spec, { validateOnly = false } = {}) {
    return this.post(`${actId}/campaigns`, { ...spec, ...(validateOnly ? { execution_options: ['validate_only'] } : {}) });
  }

  createAdSet(actId, spec, { validateOnly = false } = {}) {
    return this.post(`${actId}/adsets`, { ...spec, ...(validateOnly ? { execution_options: ['validate_only'] } : {}) });
  }

  uploadImage(actId, base64, name = 'criativo.jpg') {
    return this.post(`${actId}/adimages`, { bytes: base64, name }).then((r) => {
      const first = r.images && Object.values(r.images)[0];
      if (!first || !first.hash) throw new MetaError({ message: 'A Meta não retornou o identificador da imagem.' });
      return first.hash;
    });
  }

  createCreative(actId, spec) { return this.post(`${actId}/adcreatives`, spec); }
  createAd(actId, spec) { return this.post(`${actId}/ads`, spec); }
  setStatus(objectId, status) { return this.post(objectId, { status }); }
}

// ---------- OAuth (login com Facebook) ----------
function buildAuthUrl({ appId, redirectUri, state, scopes = config.META_SCOPES, version = config.META_API_VERSION }) {
  const u = new URL(`${config.META_DIALOG}/${version}/dialog/oauth`);
  u.search = new URLSearchParams({ client_id: appId, redirect_uri: redirectUri, state, scope: scopes.join(','), response_type: 'code' }).toString();
  return u.toString();
}

async function oauthGet(path, params, fetchImpl = globalThis.fetch, version = config.META_API_VERSION) {
  const u = new URL(`${config.META_GRAPH}/${version}/${path}`);
  u.search = new URLSearchParams(params).toString();
  let res;
  try { res = await fetchImpl(u.toString()); } catch (e) { throw new MetaError({ message: redactString(e.message), rede: true }); }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const er = body.error || {};
    throw new MetaError({ message: redactString(er.message || `HTTP ${res.status}`), code: er.code, subcode: er.error_subcode, status: res.status });
  }
  return body;
}

async function exchangeCode({ appId, appSecret, redirectUri, code, fetchImpl }) {
  const short = await oauthGet('oauth/access_token', { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }, fetchImpl);
  // Troca por token de longa duração (cerca de 60 dias). Renovar antes de expirar.
  const long = await oauthGet('oauth/access_token', { grant_type: 'fb_exchange_token', client_id: appId, client_secret: appSecret, fb_exchange_token: short.access_token }, fetchImpl);
  return { token: long.access_token, expiresIn: long.expires_in || null, tipo: 'usuario_longa_duracao' };
}

async function debugToken({ token, appId, appSecret, fetchImpl }) {
  const r = await oauthGet('debug_token', { input_token: token, access_token: `${appId}|${appSecret}` }, fetchImpl);
  const d = r.data || {};
  return { valido: !!d.is_valid, expiraEm: d.expires_at ? new Date(d.expires_at * 1000).toISOString() : null, escopos: d.scopes || [], appId: d.app_id };
}

module.exports = { MetaClient, MetaError, buildAuthUrl, exchangeCode, debugToken, explain };
