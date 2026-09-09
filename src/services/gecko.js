// src/services/gecko.js
// NEURON Blockchain Systems — GeckoTerminal public API (без ключа)

const GT_BASE = 'https://api.geckoterminal.com/api/v2';
const POOL_ADDRESS = 'EQC787ykiGAglkz0Bu-kJGuYgYmuNvMcAoUyb33VOy-AACbS';

const cache = { data: null, ts: 0 };
const CACHE_TTL = 60000;

async function fetchJson(url, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`GT HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

// цена COGNIQ + %24ч + спарк для карточек биржи
async function getCogniqMarket() {
  const now = Date.now();
  if (cache.data && now - cache.ts < CACHE_TTL) return cache.data;

  try {
    const [poolRes, ohlcvRes] = await Promise.allSettled([
      fetchJson(`${GT_BASE}/networks/ton/pools/${POOL_ADDRESS}`),
      fetchJson(`${GT_BASE}/networks/ton/pools/${POOL_ADDRESS}/ohlcv/hour?aggregate=1&limit=24&currency=usd`)
    ]);

    const pool = poolRes.status === 'fulfilled' ? poolRes.value?.data?.attributes : null;
    if (!pool) throw new Error('GT pool empty');

    const price = parseFloat(pool.base_token_price_usd || '0');
    let changePct = parseFloat(pool.price_change_percentage?.h24 ?? '0');

    let spark = [];
    let candles = [];
    if (ohlcvRes.status === 'fulfilled') {
      const list = ohlcvRes.value?.data?.attributes?.ohlcv_list || [];
      candles = list
        .filter(k => isFinite(parseFloat(k[4])))
        .map(k => [parseInt(k[0]), parseFloat(k[4])])
        .reverse(); // по возрастанию времени: [timestamp, close]
      spark = candles.map(c => c[1]);
    }

    // дотягиваем до 24 точек: часов без сделок нет в ответе — дополняем первой ценой
    if (spark.length) {
      while (spark.length < 24) spark.unshift(spark[0]);
      spark = spark.slice(-24);
    }

    // процент считаем сами из свечей: поле h24 у GT на тонких пулах врёт
    if (candles.length) {
      const cutoff = Math.floor(Date.now() / 1000) - 86400;
      let base = candles[0][1];
      for (const k of candles) {
        if (k[0] <= cutoff) base = k[1]; else break;
      }
      const last = candles[candles.length - 1][1];
      if (base > 0 && last > 0) changePct = ((last - base) / base) * 100;
    }

    const result = { price, change24h: changePct / 100, spark };
    cache.data = result;
    cache.ts = now;
    return result;
  } catch (e) {
    console.warn('[GECKO] COGNIQ market error:', e.message);
    return cache.data;
  }
}

module.exports = { getCogniqMarket, POOL_ADDRESS };
