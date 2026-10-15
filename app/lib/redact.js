'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Remove segredos de qualquer texto ou objeto antes de gravar em log, histórico ou relatório.

const SECRET_KEYS = /^(access_token|token|app_secret|client_secret|appsecret_proof|password|senha|secret|code|fb_exchange_token|authorization)$/i;

const PATTERNS = [
  // Tokens de acesso da Meta começam com EAA.
  [/EAA[A-Za-z0-9]{20,}/g, '[TOKEN_REMOVIDO]'],
  [/(access_token|client_secret|app_secret|appsecret_proof|fb_exchange_token|code)=([^&\s"']+)/gi, '$1=[REMOVIDO]'],
  [/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REMOVIDO]'],
];

function redactString(str) {
  let out = String(str);
  for (const [re, rep] of PATTERNS) out = out.replace(re, rep);
  return out;
}

function redact(value, depth = 0) {
  if (depth > 12) return '[PROFUNDO_DEMAIS]';
  if (value == null) return value;
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEYS.test(k) ? '[REMOVIDO]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

function containsSecret(text) {
  const s = typeof text === 'string' ? text : JSON.stringify(text);
  return /EAA[A-Za-z0-9]{20,}/.test(s) || /(access_token|client_secret|app_secret)=(?!\[REMOVIDO\])[^&\s"']+/i.test(s);
}

module.exports = { redact, redactString, containsSecret };
