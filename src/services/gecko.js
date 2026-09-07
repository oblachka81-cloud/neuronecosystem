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
    const changePct = parseFloat(pool.price_change_percentage?.h24 ?? '0');

    let spark = [];
    if (ohlcvRes.status === 'fulfilled') {
      const list = ohlcvRes.value?.data?.attributes?.ohlcv_list || [];
      spark = list.map(k => parseFloat(k[4])).filter(v => isFinite(v)).reverse();
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
