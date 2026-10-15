'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Cofre de credenciais. Nunca grava texto puro.
//  - Windows: DPAPI (ProtectedData, escopo do usuário do Windows) via PowerShell, com o segredo
//    enviado por stdin (não aparece na linha de comando nem na lista de processos).
//  - Outros sistemas (ou testes): AES-256-GCM com chave em M6D_SECRET_KEY (64 hex). Sem chave,
//    o cofre se recusa a gravar e orienta usar a variável de ambiente META_ACCESS_TOKEN.
// O valor do segredo nunca é devolvido pela API HTTP nem registrado em log.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const config = require('./config');

class SecretError extends Error {
  constructor(msg) { super(msg); this.name = 'SecretError'; }
}

function secretsDir() {
  return process.env.M6D_SECRETS_DIR || config.SECRETS_DIR;
}

function backend() {
  if (process.env.M6D_SECRET_BACKEND) return process.env.M6D_SECRET_BACKEND;
  return process.platform === 'win32' ? 'dpapi' : 'aes';
}

const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,60}$/;

function fileFor(scope, name) {
  if (!NAME_RE.test(scope) || !NAME_RE.test(name)) throw new SecretError('Nome de segredo inválido.');
  return path.join(secretsDir(), scope, `${name}.json`);
}

function ps(script, input) {
  return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    input,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 20000,
  }).trim();
}

function dpapiProtect(plain) {
  const script = "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Security;$i=[Console]::In.ReadToEnd();$b=[Text.Encoding]::UTF8.GetBytes($i);[Convert]::ToBase64String([Security.Cryptography.ProtectedData]::Protect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))";
  return ps(script, plain);
}

function dpapiUnprotect(b64) {
  const script = "$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Security;$i=[Console]::In.ReadToEnd().Trim();$b=[Convert]::FromBase64String($i);[Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser))";
  return ps(script, b64);
}

function aesKey() {
  const k = process.env.M6D_SECRET_KEY;
  if (!k || !/^[0-9a-fA-F]{64}$/.test(k)) throw new SecretError('Armazenamento seguro indisponível: defina M6D_SECRET_KEY (64 caracteres hex) ou use a variável de ambiente META_ACCESS_TOKEN sem gravar em disco.');
  return Buffer.from(k, 'hex');
}

function aesProtect(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', aesKey(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64');
}

function aesUnprotect(b64) {
  const buf = Buffer.from(b64, 'base64');
  const d = crypto.createDecipheriv('aes-256-gcm', aesKey(), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString('utf8');
}

function saveSecret(scope, name, value, info = {}) {
  if (!value || typeof value !== 'string') throw new SecretError('Valor vazio.');
  const file = fileFor(scope, name); // valida o nome antes de qualquer coisa
  const b = backend();
  let ciphertext;
  try {
    ciphertext = b === 'dpapi' ? dpapiProtect(value) : aesProtect(value);
  } catch (e) {
    if (e instanceof SecretError) throw e;
    throw new SecretError(`Falha ao proteger a credencial (${b}). Nada foi gravado.`);
  }
  if (!ciphertext || (value.length >= 12 && ciphertext.includes(value))) throw new SecretError('Proteção da credencial falhou. Nada foi gravado.');
  const rec = { backend: b, ciphertext, salvoEm: new Date().toISOString(), info };
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(rec), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(tmp, file);
  // Confirma que é possível ler de volta.
  if (getSecret(scope, name) !== value) throw new SecretError('Credencial gravada, mas a conferência falhou. Tente novamente.');
  return { ok: true, salvoEm: rec.salvoEm, info };
}

function getSecret(scope, name) {
  const file = fileFor(scope, name);
  let rec;
  try { rec = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw new SecretError('Cofre ilegível.'); }
  try {
    return rec.backend === 'dpapi' ? dpapiUnprotect(rec.ciphertext) : aesUnprotect(rec.ciphertext);
  } catch (e) {
    if (e instanceof SecretError) throw e;
    throw new SecretError('Não foi possível abrir a credencial (outro usuário do Windows ou chave diferente). Conecte a Meta novamente.');
  }
}

function secretInfo(scope, name) {
  const file = fileFor(scope, name);
  try {
    const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { existe: true, backend: rec.backend, salvoEm: rec.salvoEm, info: rec.info || {} };
  } catch (e) {
    return { existe: false };
  }
}

function deleteSecret(scope, name) {
  try { fs.unlinkSync(fileFor(scope, name)); return { ok: true }; } catch (e) { if (e.code === 'ENOENT') return { ok: true }; throw e; }
}

module.exports = { saveSecret, getSecret, secretInfo, deleteSecret, backend, SecretError };
