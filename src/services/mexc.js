// src/services/mexc.js
// NEURON Blockchain Systems — CEX market data
// Внутренний источник не раскрываем, наружу отдаём как "CEX"

const MEXC_BASE = 'https://api.mexc.com';

// наш символ -> пара на CEX
const MEXC_SYMBOLS = {
  TON:   'TONUSDT',
  BTC:   'BTCUSDT',
  XAUt0: 'XAUTUSDT',
  AAPLx: 'AAPLXUSDT',
  NVDAx: 'NVDAXUSDT',
  TSLAx: 'TSLAXUSDT',
  AMZNx: 'AMZNXUSDT',
  SPYx:  'SPYXUSDT',
};

const CATEGORIES = {
  crypto:  ['TON', 'BTC', 'XAUt0'],
  xstocks: ['AAPLx', 'NVDAx', 'TSLAx', 'AMZNx', 'SPYx'],
};

const cache = { data: {}, ts: 0 };
const CACHE_TTL = 15000;

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`CEX HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

// цена + % за 24ч
async function getTickers(symbols) {
  const pairs = symbols.map(s => MEXC_SYMBOLS[s]).filter(Boolean);
  if (!pairs.length) return {};

  const key = pairs.join(',');
  const now = Date.now();
  if (cache.data[key] && now - cache.ts < CACHE_TTL) return cache.data[key];

  const url = `${MEXC_BASE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`;
  const list = await fetchJson(url);

  const out = {};
  for (const item of (Array.isArray(list) ? list : [list])) {
    const internal = Object.keys(MEXC_SYMBOLS).find(k => MEXC_SYMBOLS[k] === item.symbol);
    if (!internal) continue;
    out[internal] = {
      price: parseFloat(item.lastPrice),
      change24h: parseFloat(item.priceChangePercent),
    };
  }
  cache.data[key] = out;
  cache.ts = now;
  return out;
}

// свечи — пригодятся на шаге 4 (графики)
async function getKlines(symbol, interval = '1h', limit = 48) {
  const pair = MEXC_SYMBOLS[symbol];
  if (!pair) return [];
  const data = await fetchJson(`${MEXC_BASE}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`);
  return (Array.isArray(data) ? data : []).map(k => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
}

module.exports = { getTickers, getKlines, MEXC_SYMBOLS, CATEGORIES };
