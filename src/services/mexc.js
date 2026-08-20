// src/services/mexc.js
// NEURON Blockchain Systems — CEX market data
// Источник не раскрываем, наружу отдаём как "CEX"

const MEXC_BASE = 'https://api.mexc.com';

// наш символ -> кандидаты пар (первая живая = рабочая)
const CANDIDATES = {
  TON:   ['GRAMUSDT', 'TONUSDT'],   // TON на MEXC = GRAM
  BTC:   ['BTCUSDT'],
  XAUt0: ['GOLD(XAUT)USDT', 'XAUTUSDT', 'GOLDUSDT', 'PAXGUSDT'],
  AAPLx: ['AAPLXUSDT', 'AAPLUSDT'],
  NVDAx: ['NVDAXUSDT', 'NVDAUSDT'],
  TSLAx: ['TSLAXUSDT', 'TSLAUSDT'],
  AMZNx: ['AMZNXUSDT', 'AMZNUSDT'],
  SPYx:  ['SPYXUSDT', 'SP500USDT'],
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

// все живые пары спота (кэш 1 час)
let _spotSet = null, _spotTs = 0;
async function spotSet() {
  if (_spotSet && Date.now() - _spotTs < 3600000) return _spotSet;
  try {
    const d = await fetchJson(`${MEXC_BASE}/api/v3/exchangeInfo`, 8000);
    _spotSet = new Set((d.symbols || []).map(s => s.symbol));
    _spotTs = Date.now();
  } catch (e) {
    if (!_spotSet) _spotSet = new Set();
  }
  return _spotSet;
}

// цена + % за 24ч
async function getTickers(symbols) {
  const set = await spotSet();
  const pairs = [];
  const backMap = {};
  for (const s of symbols) {
    const cands = CANDIDATES[s] || [];
    const pair = cands.find(c => set.has(c)) || cands[0];
    if (pair) { pairs.push(pair); backMap[pair] = s; }
  }
  if (!pairs.length) return {};

  const key = pairs.join(',');
  const now = Date.now();
  if (cache.data[key] && now - cache.ts < CACHE_TTL) return cache.data[key];

  const url = `${MEXC_BASE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(pairs))}`;
  const list = await fetchJson(url);

  const out = {};
  for (const item of (Array.isArray(list) ? list : [list])) {
    const internal = backMap[item.symbol];
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

// свечи — пригодятся для графиков позже
async function getKlines(symbol, interval = '1h', limit = 48) {
  const set = await spotSet();
  const cands = CANDIDATES[symbol] || [];
  const pair = cands.find(c => set.has(c)) || cands[0];
  if (!pair) return [];
  const data = await fetchJson(`${MEXC_BASE}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`);
  return (Array.isArray(data) ? data : []).map(k => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
}

module.exports = { getTickers, getKlines, CANDIDATES, CATEGORIES };
