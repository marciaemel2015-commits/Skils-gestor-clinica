'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Log técnico em logs/app-AAAA-MM-DD.log. Tudo passa por redact() antes de ser gravado.

const fs = require('fs');
const path = require('path');
const config = require('./config');
const { redact, redactString } = require('./redact');

function logDir() {
  return process.env.M6D_LOG_DIR || config.LOG_DIR;
}

function write(level, msg, extra) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg: redactString(msg),
    extra: extra === undefined ? undefined : redact(extra),
  });
  try {
    fs.mkdirSync(logDir(), { recursive: true });
    const file = path.join(logDir(), `app-${new Date().toISOString().slice(0, 10)}.log`);
    fs.appendFileSync(file, line + '\n', 'utf8');
  } catch (e) {
    // Falha de log nunca derruba a operação, mas é avisada no console.
    process.stderr.write(`[log indisponível] ${e.message}\n`);
  }
  if (process.env.M6D_QUIET !== '1') process.stdout.write(line + '\n');
}

module.exports = {
  info: (m, e) => write('info', m, e),
  warn: (m, e) => write('warn', m, e),
  error: (m, e) => write('error', m, e),
};
