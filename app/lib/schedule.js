'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Programação: início no dia seguinte às 00:00 no fuso horário DA CONTA DE ANÚNCIOS
// (timezone_name retornado pela Meta), não no fuso do computador.

function partsIn(tz, date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = {};
  for (const { type, value } of fmt.formatToParts(date)) p[type] = value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

// Diferença (minutos) entre o horário local do fuso e UTC naquele instante.
function offsetMinutes(tz, date) {
  const p = partsIn(tz, date);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

function assertTz(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch (e) { throw new Error(`Fuso horário inválido: ${tz}`); }
  if (!tz) throw new Error('Fuso horário da conta de anúncios não informado.');
}

function fmtOffset(min) {
  const sign = min >= 0 ? '+' : '-';
  const a = Math.abs(min);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

function nextMidnight(tz, now = new Date()) {
  assertTz(tz);
  const today = partsIn(tz, now);
  const t = new Date(Date.UTC(today.y, today.m - 1, today.d + 1));
  const y = t.getUTCFullYear(); const m = t.getUTCMonth() + 1; const d = t.getUTCDate();
  const naive = Date.UTC(y, m - 1, d, 0, 0, 0);
  let off = offsetMinutes(tz, new Date(naive));
  let instant = naive - off * 60000;
  const off2 = offsetMinutes(tz, new Date(instant));
  if (off2 !== off) { off = off2; instant = naive - off * 60000; }
  const local = partsIn(tz, new Date(instant));
  const exata = local.h === 0 && local.mi === 0 && local.d === d;
  const pad = (n) => String(n).padStart(2, '0');
  const isoLocal = `${local.y}-${pad(local.m)}-${pad(local.d)}T${pad(local.h)}:${pad(local.mi)}:00${fmtOffset(offsetMinutes(tz, new Date(instant)))}`;
  return {
    unix: Math.floor(instant / 1000),
    iso: isoLocal,
    fuso: tz,
    dataLocal: `${pad(d)}/${pad(m)}/${y}`,
    exata,
    aviso: exata ? null : 'Meia-noite não existe nesse dia neste fuso (horário de verão). A campanha começa no primeiro horário válido.',
  };
}

// Data do próximo monitoramento: N dias depois do início, às 10h no fuso da conta.
function monitoringDate(startUnix, dias, tz) {
  assertTz(tz);
  const start = new Date(startUnix * 1000);
  const p = partsIn(tz, start);
  const naive = Date.UTC(p.y, p.m - 1, p.d + dias, 10, 0, 0);
  const off = offsetMinutes(tz, new Date(naive));
  return new Date(naive - off * 60000).toISOString();
}

module.exports = { nextMidnight, monitoringDate, offsetMinutes, partsIn };
