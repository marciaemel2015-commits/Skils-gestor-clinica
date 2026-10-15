'use strict';
// © 2026 — Método Clínica de Estética 6D. Todos os direitos reservados à titular.
// Extrai latitude/longitude de um link do Google Maps para montar o raio do anúncio.

const PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // ponto exato do lugar
  /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // centro do mapa
  /[?&](?:q|ll|query|destination)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i,
  /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/, // coordenadas coladas diretamente
];

function parseCoords(text) {
  if (!text) return null;
  const s = String(text);
  for (const re of PATTERNS) {
    const m = s.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)) return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

function isShortLink(text) {
  return /^(https?:\/\/)?(maps\.app\.goo\.gl|goo\.gl\/maps)\//i.test(String(text || '').trim());
}

// Links curtos precisam ser expandidos (uma requisição de rede ao Google, sem enviar dados da clínica).
async function resolveShortLink(url, fetchImpl = fetch) {
  let current = String(url).trim();
  if (!/^https?:\/\//.test(current)) current = `https://${current}`;
  for (let i = 0; i < 5; i++) {
    const r = await fetchImpl(current, { redirect: 'manual' });
    const loc = r.headers.get('location');
    if (!loc) break;
    current = new URL(loc, current).toString();
    if (parseCoords(current)) return current;
  }
  return current;
}

async function coordsFromLink(link, fetchImpl) {
  const direct = parseCoords(link);
  if (direct) return { ...direct, fonte: 'link' };
  if (isShortLink(link)) {
    const full = await resolveShortLink(link, fetchImpl);
    const c = parseCoords(full);
    if (c) return { ...c, fonte: 'link_expandido' };
  }
  return null;
}

module.exports = { parseCoords, isShortLink, resolveShortLink, coordsFromLink };
