// src/services/mexc.js
// NEURON Blockchain Systems — CEX market data (MEXC + Gate.io)

const MEXC_BASE = 'https://api.mexc.com';
const GATE_BASE = 'https://api.gateio.ws/api/v4';

// наш символ -> кандидаты пар (первая живая = рабочая)
const CANDIDATES = {
  TON:   ['GRAMUSDT', 'TONUSDT'],
  BTC:   ['BTCUSDT'],
  XAUt0: ['GOLD(XAUT)USDT', 'XAUTUSDT', 'GOLDUSDT', 'PAXGUSDT'],
  AAPLx: ['AAPLXUSDT', 'AAPLUSDT'],
  NVDAx: ['NVDAXUSDT', 'NVDAUSDT'],
  TSLAx: ['TSLAXUSDT', 'TSLAUSDT'],
  AMZNx: ['AMZNXUSDT', 'AMZNUSDT'],
  SPYx:  ['SPYXUSDT', 'SP500USDT'],
  COINx: ['COINXUSDT', 'COINUSDT'],
  HOODx: ['HOODXUSDT', 'HOODUSDT'],
  MSTRx: ['MSTRX_USDT'], // Gate.io формат
  QQQx:  ['QQQX_USDT'],  // Gate.io формат
};

const CATEGORIES = {
  crypto:  ['TON', 'BTC', 'XAUt0'],
  xstocks: ['AAPLx', 'NVDAx', 'TSLAx', 'AMZNx', 'SPYx', 'COINx', 'HOODx', 'MSTRx', 'QQQx'],
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

// все живые пары спота MEXC (кэш 1 час)
let _mexcSpotSet = null, _mexcSpotTs = 0;
async function mexcSpotSet() {
  if (_mexcSpotSet && Date.now() - _mexcSpotTs < 3600000) return _mexcSpotSet;
  try {
    const d = await fetchJson(`${MEXC_BASE}/api/v3/exchangeInfo`, 8000);
    _mexcSpotSet = new Set((d.symbols || []).map(s => s.symbol));
    _mexcSpotTs = Date.now();
  } catch (e) {
    if (!_mexcSpotSet) _mexcSpotSet = new Set();
  }
  return _mexcSpotSet;
}

// все живые пары спота Gate.io (кэш 1 час)
let _gateSpotSet = null, _gateSpotTs = 0;
async function gateSpotSet() {
  if (_gateSpotSet && Date.now() - _gateSpotTs < 3600000) return _gateSpotSet;
  try {
    const d = await fetchJson(`${GATE_BASE}/spot/currency_pairs`, 8000);
    _gateSpotSet = new Set((Array.isArray(d) ? d : []).map(s => s.id));
    _gateSpotTs = Date.now();
  } catch (e) {
    if (!_gateSpotSet) _gateSpotSet = new Set();
  }
  return _gateSpotSet;
}

// цена + % за 24ч (MEXC + Gate.io)
async function getTickers(symbols) {
  const mexcSet = await mexcSpotSet();
  const gateSet = await gateSpotSet();
  
  const mexcPairs = [];
  const gatePairs = [];
  const backMap = {};
  
  for (const s of symbols) {
    const cands = CANDIDATES[s] || [];
    
    // Пробуем найти на MEXC
    const mexcPair = cands.find(c => mexcSet.has(c));
    if (mexcPair) {
      mexcPairs.push(mexcPair);
      backMap[mexcPair] = { symbol: s, exchange: 'mexc' };
      continue;
    }
    
    // Пробуем найти на Gate.io
    const gatePair = cands.find(c => gateSet.has(c));
    if (gatePair) {
      gatePairs.push(gatePair);
      backMap[gatePair] = { symbol: s, exchange: 'gate' };
    }
  }
  
  if (!mexcPairs.length && !gatePairs.length) return {};

  const out = {};
  
  // 1. MEXC тикеры
  if (mexcPairs.length) {
    const mexcKey = 'mexc_' + mexcPairs.join(',');
    const now = Date.now();
    if (cache.data[mexcKey] && now - cache.ts < CACHE_TTL) {
      Object.assign(out, cache.data[mexcKey]);
    } else {
      const url = `${MEXC_BASE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(mexcPairs))}`;
      const list = await fetchJson(url);
      const mexcOut = {};
      for (const item of (Array.isArray(list) ? list : [list])) {
        const info = backMap[item.symbol];
        if (info && info.exchange === 'mexc') {
          mexcOut[info.symbol] = {
            price: parseFloat(item.lastPrice),
            change24h: parseFloat(item.priceChangePercent),
          };
        }
      }
      Object.assign(out, mexcOut);
      cache.data[mexcKey] = mexcOut;
      cache.ts = now;
    }
  }
  
  // 2. Gate.io тикеры
  if (gatePairs.length) {
    const gateKey = 'gate_' + gatePairs.join(',');
    const now = Date.now();
    if (cache.data[gateKey] && now - cache.ts < CACHE_TTL) {
      Object.assign(out, cache.data[gateKey]);
    } else {
      // Gate.io API: GET /spot/tickers?currency_pair=XXX_USDT
      const gateOut = {};
      for (const gatePair of gatePairs) {
        try {
          const url = `${GATE_BASE}/spot/tickers?currency_pair=${gatePair}`;
          const list = await fetchJson(url);
          if (Array.isArray(list) && list.length) {
            const item = list[0];
            const info = backMap[gatePair];
            gateOut[info.symbol] = {
              price: parseFloat(item.last),
              change24h: parseFloat(item.change_percentage.replace('%', '')),
            };
          }
        } catch (e) {
          console.error(`[GATE] ${gatePair} error:`, e.message);
        }
      }
      Object.assign(out, gateOut);
      cache.data[gateKey] = gateOut;
      cache.ts = now;
    }
  }
  
  return out;
}

// свечи — MEXC + Gate.io
async function getKlines(symbol, interval = '60m', limit = 48) {
  const mexcSet = await mexcSpotSet();
  const gateSet = await gateSpotSet();
  
  const cands = CANDIDATES[symbol] || [];
  
  // Пробуем MEXC
  const mexcPair = cands.find(c => mexcSet.has(c));
  if (mexcPair) {
    const data = await fetchJson(`${MEXC_BASE}/api/v3/klines?symbol=${mexcPair}&interval=${interval}&limit=${limit}`);
    return (Array.isArray(data) ? data : []).map(k => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
  }
  
  // Пробуем Gate.io
  const gatePair = cands.find(c => gateSet.has(c));
  if (gatePair) {
    // Gate.io: interval can be 1m, 5m, 15m, 30m, 1h, 4h, 1d, 7d, 30d
    const gateInterval = interval === '60m' ? '1h' : interval;
    const data = await fetchJson(`${GATE_BASE}/spot/candlesticks?currency_pair=${gatePair}&interval=${gateInterval}&limit=${limit}`);
    return (Array.isArray(data) ? data : []).map(k => ({ t: k[0] * 1000, o: +k[5], h: +k[3], l: +k[4], c: +k[2] }));
  }
  
  return [];
}

// спарклайны (24 свечи по 1ч), кэш 60 сек
const sparkCache = { data: {}, ts: 0 };
async function getSparks(symbols, interval = '60m', limit = 24) {
  const key = symbols.join(',');
  const now = Date.now();
  if (sparkCache.data[key] && now - sparkCache.ts < 60000) return sparkCache.data[key];
  
  const mexcSet = await mexcSpotSet();
  const gateSet = await gateSpotSet();
  const out = {};
  
  await Promise.allSettled(symbols.map(async (s) => {
    const cands = CANDIDATES[s] || [];
    
    // Пробуем MEXC
    let pair = cands.find(c => mexcSet.has(c));
    let exchange = 'mexc';
    
    // Если не нашли на MEXC, пробуем Gate.io
    if (!pair) {
      pair = cands.find(c => gateSet.has(c));
      exchange = 'gate';
    }
    
    if (!pair) {
      console.log(`[SPARKS] ${s}: no pair found`);
      return;
    }
    
    try {
      let url, candles;
      if (exchange === 'mexc') {
        url = `${MEXC_BASE}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;
        const d = await fetchJson(url);
        candles = Array.isArray(d) ? d : [];
        if (candles.length) {
          out[s] = candles.map(k => +k[4]);
        }
      } else {
        const gateInterval = interval === '60m' ? '1h' : interval;
        url = `${GATE_BASE}/spot/candlesticks?currency_pair=${pair}&interval=${gateInterval}&limit=${limit}`;
        const d = await fetchJson(url);
        candles = Array.isArray(d) ? d : [];
        if (candles.length) {
          out[s] = candles.map(k => +k[2]); // close price
        }
      }
      
      if (candles.length) {
        console.log(`[SPARKS] ${s} (${pair} @ ${exchange}): ${candles.length} candles`);
      } else {
        console.log(`[SPARKS] ${s} (${pair} @ ${exchange}): empty response`);
      }
    } catch (e) {
      console.log(`[SPARKS] ${s} (${pair} @ ${exchange}) error:`, e.message);
    }
  }));
  
  sparkCache.data[key] = out;
  sparkCache.ts = now;
  return out;
}

module.exports = { getTickers, getKlines, getSparks, CANDIDATES, CATEGORIES };
