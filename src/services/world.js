const UA = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36' } };

const WORLD_SYMBOLS = [
  { key: 'XAU', yahoo: 'XAUUSD=X', label: 'GOLD' },
  { key: 'XAG', yahoo: 'XAGUSD=X', label: 'SILVER' },
  { key: 'XPT', yahoo: 'XPTUSD=X', label: 'PLATINUM' },
  { key: 'XPD', yahoo: 'XPDUSD=X', label: 'PALLADIUM' },
  { key: 'WTI', yahoo: 'CL=F', label: 'OIL WTI' },
  { key: 'BRENT', yahoo: 'BZ=F', label: 'BRENT' },
  { key: 'SPX', yahoo: '^GSPC', label: 'S&P 500' },
  { key: 'NDX', yahoo: '^IXIC', label: 'NASDAQ' },
  { key: 'DJI', yahoo: '^DJI', label: 'DOW JONES' },
  { key: 'EURUSD', yahoo: 'EURUSD=X', label: 'EUR/USD' },
  { key: 'GBPUSD', yahoo: 'GBPUSD=X', label: 'GBP/USD' },
  { key: 'USDJPY', yahoo: 'USDJPY=X', label: 'USD/JPY' },
  { key: 'DXY', yahoo: 'DX-Y.NYB', label: 'DOLLAR INDEX' }
];

let worldCache = { ts: 0, data: null };

async function fetchSymbol(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym.yahoo)}?interval=5m&range=1d`;
  const res = await fetch(url, UA);
  const j = await res.json();
  const r = j.chart?.result?.[0];
  const meta = r?.meta;
  if (!meta) return null;
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose || meta.previousClose;
  const change = prev ? (price - prev) / prev : 0;
  const closes = (r.indicators?.quote?.[0]?.close || []).filter(v => v != null);
  const step = Math.max(1, Math.floor(closes.length / 24));
  const spark = closes.filter((_, i) => i % step === 0).slice(0, 24);
  return { price, change24h: change, spark };
}

async function getWorld() {
  const now = Date.now();
  if (worldCache.data && now - worldCache.ts < 15000) return worldCache.data;
  const out = {};
  await Promise.allSettled(WORLD_SYMBOLS.map(async s => {
    try {
      const d = await fetchSymbol(s);
      if (d) out[s.key] = { ...d, label: s.label };
    } catch (e) {}
  }));
  if (Object.keys(out).length) worldCache = { ts: now, data: out };
  return worldCache.data || out;
}

module.exports = { getWorld };
