// src/services/mexc.js
// NEURON Blockchain Systems — CEX market data (Spot + Futures)

const MEXC_SPOT = 'https://api.mexc.com';
const MEXC_FUTURES = 'https://contract.mexc.com';

const CANDIDATES = {
  TON:   ['GRAMUSDT', 'TONUSDT'],
  BTC:   ['BTCUSDT'],
  XAUt0: ['GOLD(XAUT)USDT', 'XAUTUSDT', 'GOLDUSDT', 'PAXGUSDT'],
  AAPLx: ['AAPLXUSDT', 'AAPLUSDT'],
  NVDAx: ['NVDAXUSDT', 'NVDAUSDT'],
  TSLAx: ['TSLAXUSDT', 'TSLAUSDT'],
  AMZNx: ['AMZNXUSDT', 'AMZNUSDT'],
  SPYx:  ['SPYXUSDT', 'SP500USDT'],
};

// Фьючерсные кандидаты (ПРОВЕРЕНО: реальные символы на MEXC)
const FUTURES_CANDIDATES = {
  MSTRx: ['MSTRUSDT'],
  QQQx:  ['QQQUSDT'],
};

const CATEGORIES = {
  crypto:  ['TON', 'BTC', 'XAUt0'],
  xstocks: ['AAPLx', 'NVDAx', 'TSLAx', 'AMZNx', 'SPYx', 'MSTRx', 'QQQx'],
};

const cache = { data: {}, ts: 0 };
const CACHE_TTL = 15000;

async function fetchJson(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`CEX HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Спотовые пары
let _spotSet = null, _spotTs = 0;
async function spotSet() {
  if (_spotSet && Date.now() - _spotTs < 3600000) return _spotSet;
  try {
    const d = await fetchJson(`${MEXC_SPOT}/api/v3/exchangeInfo`, 8000);
    _spotSet = new Set((d.symbols || []).map(s => s.symbol));
    _spotTs = Date.now();
  } catch (e) {
    if (!_spotSet) _spotSet = new Set();
  }
  return _spotSet;
}

// Фьючерсные пары
let _futuresSet = null, _futuresTs = 0;
async function futuresSet() {
  if (_futuresSet && Date.now() - _futuresTs < 3600000) return _futuresSet;
  try {
    const d = await fetchJson(`${MEXC_FUTURES}/api/v1/contract/detail`, 8000);
    const contracts = d.success ? d.data : [];
    _futuresSet = new Set(contracts.map(s => s.symbol));
    _futuresTs = Date.now();
  } catch (e) {
    if (!_futuresSet) _futuresSet = new Set();
  }
  return _futuresSet;
}

// Маппинг интервалов для фьючерсов MEXC
function getMexcFuturesInterval(interval) {
  const map = {
    '1m': 'Min1', '3m': 'Min3', '5m': 'Min5', '15m': 'Min15',
    '30m': 'Min30', '60m': 'Min60', '4h': 'Hour4', '1d': 'Day1', '1w': 'Week1'
  };
  return map[interval] || 'Min60';
}

// Тикеры (спот + фьючерсы)
async function getTickers(symbols) {
  const spot = await spotSet();
  const futures = await futuresSet();
  
  const spotPairs = [];
  const futuresPairs = [];
  const backMap = {};
  
  for (const s of symbols) {
    const spotCands = CANDIDATES[s] || [];
    const spotPair = spotCands.find(c => spot.has(c)) || spotCands[0];
    if (spotPair) {
      spotPairs.push(spotPair);
      backMap[spotPair] = { symbol: s, type: 'spot' };
    }
    
    const futCands = FUTURES_CANDIDATES[s] || [];
    const futPair = futCands.find(c => futures.has(c)) || futCands[0];
    if (futPair) {
      futuresPairs.push(futPair);
      backMap[futPair] = { symbol: s, type: 'futures' };
    }
  }
  
  if (!spotPairs.length && !futuresPairs.length) return {};

  const out = {};
  
  // 1. Спотовые тикеры
  if (spotPairs.length) {
    const spotKey = 'spot_' + spotPairs.join(',');
    const now = Date.now();
    if (cache.data[spotKey] && now - cache.ts < CACHE_TTL) {
      Object.assign(out, cache.data[spotKey]);
    } else {
      const url = `${MEXC_SPOT}/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(spotPairs))}`;
      const list = await fetchJson(url);
      const spotOut = {};
      for (const item of (Array.isArray(list) ? list : [list])) {
        const info = backMap[item.symbol];
        if (info && info.type === 'spot') {
          spotOut[info.symbol] = {
            price: parseFloat(item.lastPrice),
            change24h: parseFloat(item.priceChangePercent),
          };
        }
      }
      Object.assign(out, spotOut);
      cache.data[spotKey] = spotOut;
      cache.ts = now;
    }
  }
  
  // 2. Фьючерсные тикеры
  if (futuresPairs.length) {
    const futOut = {};
    for (const futPair of futuresPairs) {
      const info = backMap[futPair];
      try {
        const url = `${MEXC_FUTURES}/api/v1/contract/ticker?symbol=${futPair}`;
        const res = await fetchJson(url);
        if (res.success && res.data) {
          futOut[info.symbol] = {
            price: parseFloat(res.data.lastPrice),
            change24h: parseFloat(res.data.riseFallRate), // MEXC отдает 0.0195, фронтенд умножит на 100
          };
        }
      } catch (e) {
        console.error(`[MEXC FUTURES] ${futPair} error:`, e.message);
      }
    }
    Object.assign(out, futOut);
  }
  
  return out;
}

// Свечи (спот + фьючерсы)
async function getKlines(symbol, interval = '60m', limit = 48) {
  const spot = await spotSet();
  const futures = await futuresSet();
  
  const spotCands = CANDIDATES[symbol] || [];
  const spotPair = spotCands.find(c => spot.has(c)) || spotCands[0];
  
  const futCands = FUTURES_CANDIDATES[symbol] || [];
  const futPair = futCands.find(c => futures.has(c)) || futCands[0];
  
  if (spotPair) {
    const data = await fetchJson(`${MEXC_SPOT}/api/v3/klines?symbol=${spotPair}&interval=${interval}&limit=${limit}`);
    return (Array.isArray(data) ? data : []).map(k => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4] }));
  }
  
  if (futPair) {
    const mexcInterval = getMexcFuturesInterval(interval);
    const res = await fetchJson(`${MEXC_FUTURES}/api/v1/contract/kline?symbol=${futPair}&interval=${mexcInterval}&limit=${limit}`);
    if (res.success && Array.isArray(res.data)) {
      return res.data.map(k => ({ 
        t: k.t, 
        o: parseFloat(k.o), 
        h: parseFloat(k.h), 
        l: parseFloat(k.l), 
        c: parseFloat(k.c) 
      }));
    }
  }
  
  return [];
}

// Спарклайны
const sparkCache = { data: {}, ts: 0 };
async function getSparks(symbols, interval = '60m', limit = 24) {
  const key = symbols.join(',');
  const now = Date.now();
  if (sparkCache.data[key] && now - sparkCache.ts < 60000) return sparkCache.data[key];
  
  const spot = await spotSet();
  const futures = await futuresSet();
  const out = {};
  
  await Promise.allSettled(symbols.map(async (s) => {
    const spotCands = CANDIDATES[s] || [];
    const spotPair = spotCands.find(c => spot.has(c)) || spotCands[0];
    
    const futCands = FUTURES_CANDIDATES[s] || [];
    const futPair = futCands.find(c => futures.has(c)) || futCands[0];
    
    let pair = null;
    let isFutures = false;
    
    if (spotPair) {
      pair = spotPair;
    } else if (futPair) {
      pair = futPair;
      isFutures = true;
    }
    
    if (!pair) {
      console.log(`[SPARKS] ${s}: no pair found`);
      return;
    }
    
    try {
      const mexcInterval = isFutures ? getMexcFuturesInterval(interval) : interval;
      const url = isFutures 
        ? `${MEXC_FUTURES}/api/v1/contract/kline?symbol=${pair}&interval=${mexcInterval}&limit=${limit}`
        : `${MEXC_SPOT}/api/v3/klines?symbol=${pair}&interval=${mexcInterval}&limit=${limit}`;
      
      const res = await fetchJson(url);
      const candles = isFutures ? (res.success ? res.data : []) : res;
      
      if (Array.isArray(candles) && candles.length) {
        out[s] = candles.map(k => parseFloat(isFutures ? k.c : k[4]));
        console.log(`[SPARKS] ${s} (${pair}): ${candles.length} candles`);
      } else {
        console.log(`[SPARKS] ${s} (${pair}): empty response`);
      }
    } catch (e) {
      console.log(`[SPARKS] ${s} (${pair}) error:`, e.message);
    }
  }));
  
  sparkCache.data[key] = out;
  sparkCache.ts = now;
  return out;
}

module.exports = { getTickers, getKlines, getSparks, CANDIDATES, CATEGORIES };
