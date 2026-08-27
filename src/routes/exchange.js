const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitData } = require('../middleware/auth');
const { publicRateLimit, authRateLimit } = require('../middleware/rateLimit');
const { bestchangeCache, bestchangeFetch, CACHE_TTL_MS } = require('../services/bestchange');
const { COGNIQ_FEE, TOKEN_MAP, DECIMALS, OPERATIONAL_WALLET, omniston, isSwapQuote, toUnitsForSwap, toAssetId, safePayload, requestQuoteWithFee } = require('../services/exchange');
const { logTx } = require('../services/burn');
const { BESTCHANGE_API_KEY, BESTCHANGE_PARTNER_ID } = require('../config');
const { getTickers, getKlines, getSparks, CATEGORIES } = require('../services/mexc');
const { getWorld } = require('../services/world');
// ==================== BESTCHANGE ====================
router.get('/api/bestchange/currencies/:lang', publicRateLimit, async (req, res) => {
  if (!BESTCHANGE_API_KEY) return res.status(503).json({ success: false, error: 'API key not configured' });
  try {
    const lang = ['ru', 'en', 'fr', 'es'].includes(req.params.lang) ? req.params.lang : 'en';
    const cached = bestchangeCache.currencies[lang];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }
    const data = await bestchangeFetch(`/currencies/${lang}`);
    bestchangeCache.currencies[lang] = { data, timestamp: now };
    res.json({ success: true, data });
  } catch (e) {
    console.error('[BestChange] currencies error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch currencies' });
  }
});

router.get('/api/bestchange/rates/:from/:to', publicRateLimit, async (req, res) => {
  if (!BESTCHANGE_API_KEY) return res.status(503).json({ success: false, error: 'API key not configured' });
  try {
    const { from, to } = req.params;
    if (!/^\d+$/.test(from) || !/^\d+$/.test(to)) {
      return res.status(400).json({ success: false, error: 'Invalid currency IDs' });
    }
    const key = `${from}-${to}`;
    const cached = bestchangeCache.rates[key];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }
    const data = await bestchangeFetch(`/rates/${key}`);
    bestchangeCache.rates[key] = { data, timestamp: now };
    res.json({ success: true, data });
  } catch (e) {
    console.error('[BestChange] rates error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch rates' });
  }
});

router.get('/api/bestchange/changers/:lang', publicRateLimit, async (req, res) => {
  if (!BESTCHANGE_API_KEY) return res.status(503).json({ success: false, error: 'API key not configured' });
  try {
    const lang = ['ru', 'en', 'fr', 'es'].includes(req.params.lang) ? req.params.lang : 'en';
    const cached = bestchangeCache.changers[lang];
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return res.json({ success: true, data: cached.data, cached: true });
    }
    const data = await bestchangeFetch(`/changers/${lang}`);
    bestchangeCache.changers[lang] = { data, timestamp: now };
    res.json({ success: true, data });
  } catch (e) {
    console.error('[BestChange] changers error:', e.message);
    res.status(500).json({ success: false, error: 'Failed to fetch changers' });
  }
});

router.get('/api/bestchange/partner-id', publicRateLimit, (req, res) => {
  res.json({ success: true, partnerId: BESTCHANGE_PARTNER_ID });
});

// ==================== БИРЖА ====================
router.get('/api/exchange/rates', async (req, res) => {

  const FALLBACK_PRICES = { TON: 1.58, BTC: 60906, XAUt0: 2400, USDT: 1 };

  async function fetchT(url, ms = 5000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } }); }
    finally { clearTimeout(t); }
  }

  async function fetchCrypto() {
    const priceBySymbol = {};
    try {
      const response = await fetchT('https://api.ston.fi/v1/assets');
      if (response.ok) {
        const data = await response.json();
        const assets = data.asset_list || [];
        for (const a of assets) {
          const addr = (a.contract_address || '').toLowerCase();
          let price = parseFloat(a.dex_usd_price ?? '0');
          if (!price || price === 0) price = parseFloat(a.third_party_usd_price ?? '0');
          if (!price || price === 0) continue;
          if (addr === TOKEN_MAP.USDT.toLowerCase()) priceBySymbol.USDT = price;
          else if (a.kind === 'Ton') priceBySymbol.TON = price;
          else if (addr === TOKEN_MAP.NOT.toLowerCase()) priceBySymbol.NOT = price;
          else if (addr === TOKEN_MAP.DOGS.toLowerCase()) priceBySymbol.DOGS = price;
          else if (addr === TOKEN_MAP.MAJOR.toLowerCase()) priceBySymbol.MAJOR = price;
          else if (addr === TOKEN_MAP.STON.toLowerCase()) priceBySymbol.STON = price;
          else if (addr === TOKEN_MAP.REDO.toLowerCase()) priceBySymbol.REDO = price;
          else if (addr === TOKEN_MAP.STORM.toLowerCase()) priceBySymbol.STORM = price;
        }
      }
    } catch (e) { console.error('STON.fi list error:', e.message); }

    const [btcRes, xautRes] = await Promise.allSettled([
      fetchT(`https://api.ston.fi/v1/assets/${TOKEN_MAP.BTC}`),
      fetchT(`https://api.ston.fi/v1/assets/${TOKEN_MAP.XAUt0}`)
    ]);
    if (btcRes.status === 'fulfilled' && btcRes.value.ok) {
      const btc = (await btcRes.value.json()).asset;
      let p = parseFloat(btc?.dex_usd_price ?? '0');
      if (!p) p = parseFloat(btc?.third_party_usd_price ?? '0');
      if (p > 0) priceBySymbol.BTC = p;
    }
    if (xautRes.status === 'fulfilled' && xautRes.value.ok) {
      const x = (await xautRes.value.json()).asset;
      let p = parseFloat(x?.dex_usd_price ?? '0');
      if (!p) p = parseFloat(x?.third_party_usd_price ?? '0');
      if (p > 0) priceBySymbol.XAUt0 = p;
    }

    for (const k of Object.keys(FALLBACK_PRICES)) {
      if (!priceBySymbol[k] || priceBySymbol[k] === 0) priceBySymbol[k] = FALLBACK_PRICES[k];
    }

    const rates = {};
    if (priceBySymbol.TON > 0) { rates['TON/USDT'] = priceBySymbol.TON; rates['USDT/TON'] = 1 / priceBySymbol.TON; }
    if (priceBySymbol.BTC > 0) { rates['BTC/USDT'] = priceBySymbol.BTC; rates['USDT/BTC'] = 1 / priceBySymbol.BTC; }
    if (rates['BTC/USDT'] && rates['TON/USDT']) { rates['BTC/TON'] = rates['BTC/USDT'] / rates['TON/USDT']; rates['TON/BTC'] = 1 / rates['BTC/TON']; }
    if (priceBySymbol.XAUt0 > 0) { rates['XAUt0/USDT'] = priceBySymbol.XAUt0; rates['USDT/XAUt0'] = 1 / priceBySymbol.XAUt0; }
    if (priceBySymbol.NOT > 0) { rates['NOT/USDT'] = priceBySymbol.NOT; rates['USDT/NOT'] = 1 / priceBySymbol.NOT; }
    if (priceBySymbol.DOGS > 0) { rates['DOGS/USDT'] = priceBySymbol.DOGS; rates['USDT/DOGS'] = 1 / priceBySymbol.DOGS; }
    if (priceBySymbol.MAJOR > 0) { rates['MAJOR/USDT'] = priceBySymbol.MAJOR; rates['USDT/MAJOR'] = 1 / priceBySymbol.MAJOR; }
    return rates;
  }

  async function fetchXstocks() {
    const rates = {};
    const xStocksList = ['AAPLx','NVDAx','TSLAx','AMZNx','SPYx','COINx','HOODx','MSTRx','QQQx'];
    const XSTOCKS_ADDRS = {
  'AAPLx': 'EQDsjAwfKo-6FVZv2EYt-1CaZTY_ZL-pfkSId6jeQchNwmdo',
  'NVDAx': 'EQCva-Of7acQdU_piADdlcbzsFtA-xJwZoctz8ZOXBdBoaB8',
  'TSLAx': 'EQB4IwqWZPUczntdry8vSN2tsJKt-9F7iIb7gEFREYYOB563',
  'AMZNx': 'EQCtD2-7qxHhQoNhxri2JSzH-dlmWqKYCDtlEZqRi3-56gd9',
  'SPYx':  'EQB1fyBAA9qQDP6LEGaF3cbU-Xbr-p6ESBZGnqlHkHIHAJZv',
  'COINx': 'EQCvk4Oq2l5Yts_S7Q4j08fB9Ftzx3IY-7UI1AqssyKGDt_I',
  'HOODx': 'EQAHz1jK27NO5IdHrht8146-EFz9p4kSZZx2H1xXuNQOYp_r',
  'MSTRx': 'EQBbsLYH5sD74gYO4DOoj0QsHaNL81NLD13AdhkmD0Up-46H',
  'QQQx':  'EQCe6utwqROmrO_cOUUvVNYkvyecUjfugtugvhUwlVYSEm7x'
};

    await Promise.allSettled(
      xStocksList.map(async (ticker) => {
        try {
          const addr = XSTOCKS_ADDRS[ticker];
          const pr = await fetchT(`https://api.ston.fi/v1/assets/${addr}`, 15000);
          if (!pr.ok) {
            console.error(`xStocks ${ticker}: STON.fi HTTP ${pr.status}`);
            return;
          }
          const data = await pr.json();
          const asset = data.asset;
          let price = parseFloat(asset?.dex_usd_price ?? '0');
          if (!price || price === 0) price = parseFloat(asset?.third_party_usd_price ?? '0');
          if (price > 0) {
            rates[`${ticker}/USDT`] = price;
            rates[`USDT/${ticker}`] = 1 / price;
            console.log(`xStocks ${ticker} OK (STON.fi): ${price}`);
          } else {
            console.error(`xStocks ${ticker}: цена 0`);
          }
        } catch (e) {
          console.error(`xStocks ${ticker} error:`, e.message);
        }
      })
    );
    return rates;
  }

  try {
    const [cryptoRates, xstocksRates] = await Promise.all([fetchCrypto(), fetchXstocks()]);
    const rates = { ...cryptoRates, ...xstocksRates };
    if (Object.keys(rates).length === 0) throw new Error('Все источники цен недоступны');

    for (const [pair, rate] of Object.entries(rates)) {
      await pool.query('INSERT INTO exchange_rates (pair, rate) VALUES ($1, $2) ON CONFLICT (pair) DO UPDATE SET rate = $2, updated_at = NOW()', [pair, rate]);
    }
    res.json({ success: true, rates });
  } catch (err) {
    console.error('Rates error:', err.message);
    const { rows } = await pool.query('SELECT pair, rate FROM exchange_rates');
    const cachedRates = {};
    rows.forEach(r => cachedRates[r.pair] = r.rate);
    if (Object.keys(cachedRates).length > 0) {
      res.json({ success: true, rates: cachedRates, cached: true });
    } else {
      res.status(503).json({ success: false, error: err.message });
    }
  }
});

router.post('/api/exchange/swap', requireInitData, async (req, res) => {
  const { fromCurrency, toCurrency, fromAmount } = req.body;
  const userId = req.tgUser.id;
  
  try {
    const pair = `${fromCurrency}/${toCurrency}`;
    const { rows: rateRows } = await pool.query('SELECT rate FROM exchange_rates WHERE pair = $1', [pair]);
    
    let rate;
    if (rateRows.length > 0) {
      rate = rateRows[0].rate;
    } else {
      const rateRes = await fetch(`${req.protocol}://${req.get('host')}/api/exchange/rates`);
      const rateData = await rateRes.json();
      rate = rateData.rates[pair];
    }
    
    if (!rate) throw new Error('Rate not found');
    
    const rawAmount = fromAmount * rate;
    const fee = rawAmount * 0.003;
    const toAmount = rawAmount - fee;
    
    const { rows } = await pool.query(
      `INSERT INTO exchange_swaps (user_id, from_currency, to_currency, from_amount, to_amount, rate, fee, cogniq_fee, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW()) RETURNING id`,
      [userId, fromCurrency, toCurrency, fromAmount, toAmount, rate, fee, COGNIQ_FEE]
    );
    
    res.json({ 
      success: true, 
      swapId: rows[0].id,
      fromAmount,
      toAmount,
      fee,
      rate,
      message: 'Подтвердите обмен через TON Connect'
    });
    
  } catch (err) {
    console.error('Swap error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/exchange/confirm', requireInitData, async (req, res) => {
  const { swapId } = req.body;
  const userId = req.tgUser.id;
  
  try {
    const result = await pool.query(
      'UPDATE exchange_swaps SET status = $1, completed_at = NOW() WHERE id = $2 AND user_id = $3 AND status = $4 RETURNING id',
      ['completed', swapId, userId, 'pending']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Swap not found or already completed' });
    }
    
    res.json({ success: true, message: 'Обмен завершён' });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/exchange/history', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const { rows } = await pool.query(
      'SELECT * FROM exchange_swaps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [userId]
    );
    res.json({ success: true, swaps: rows });
  } catch (err) {
    console.error('Exchange history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/api/exchange/swap-data', requireInitData, async (req, res) => {
  const userId = req.tgUser.id;
  const { fromCurrency, toCurrency, fromAmount, walletAddress } = req.body;

  try {
    if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
    const userRow = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
    if (!userRow.rows[0]) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    if (userRow.rows[0].balance < COGNIQ_FEE) {
      return res.status(400).json({ 
        error: 'Недостаточно COGNIQ',
        required: COGNIQ_FEE,
        balance: userRow.rows[0].balance
      });
    }
    await pool.query('UPDATE users SET balance = balance - $1 WHERE telegram_id = $2', [COGNIQ_FEE, userId]);

    const units = toUnitsForSwap(fromAmount, fromCurrency);
    const inputAsset = toAssetId(fromCurrency);
    const outputAsset = toAssetId(toCurrency);

    const quote = await requestQuoteWithFee(omniston, { inputAsset, outputAsset, units });

    if (!isSwapQuote(quote)) {
      return res.status(400).json({ error: 'Not a swap quote' });
    }

    const traderAddress = { chain: { $case: 'ton', value: walletAddress } };

    const swapTx = await Promise.race([
      omniston.tonBuildSwap({
        quoteId: quote.quoteId,
        transferSrcAddress: traderAddress,
        refundSrcAddress: traderAddress,
        gasExcessAddress: traderAddress,
        traderDstAddress: traderAddress
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('tonBuildSwap timeout 15s')), 15000))
    ]);

    const messages = swapTx.messages.map(m => ({
      address: m.targetAddress ?? m.to ?? m.address,
      amount: (m.sendAmount ?? m.value ?? m.amount ?? '0').toString(),
      payload: safePayload(m.payload ?? m.body)
    }));

    res.json({ success: true, messages, quoteId: quote.quoteId });
  } catch (err) {
    console.error('Omniston error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/exchange/rate', requireInitData, authRateLimit, async (req, res) => {
  const wallet = process.env.TON_OPERATION_WALLET;
  res.json({ rate: 200, address: wallet || 'UQBniD_M-MTeVqUbWshZrXdQcz0m8lPstG3mQg1AL5KKCGSv', min_usdt: 1, max_usdt: 100 });
});
// ==================== NEURON LIVE MARKET ====================
router.get('/api/market/tickers', publicRateLimit, async (req, res) => {
  const category = req.query.category === 'xstocks' ? 'xstocks' : 'crypto';
  let tickers = {};
  try {
    tickers = await getTickers(CATEGORIES[category]);
    if (!Object.keys(tickers).length) throw new Error('CEX empty');
    try {
      const sparks = await getSparks(CATEGORIES[category]);
      for (const s of Object.keys(tickers)) {
        if (sparks[s]) tickers[s].spark = sparks[s];
      }
    } catch (e) {}
    res.json({ success: true, source: 'CEX', tickers });
  } catch (e) {
    console.error('[MARKET] CEX error:', e.message);
    res.json({ success: false, source: 'CEX', tickers: {} });
  }
});

router.get('/api/market/klines', publicRateLimit, async (req, res) => {
  const symbol = req.query.symbol;
 const allowed = ['1m', '3m', '5m', '15m', '60m', '4h', '1d', '1w']; 
  const interval = allowed.includes(req.query.interval) ? req.query.interval : '60m';
  try {
    const candles = await getKlines(symbol, interval, 48);
    res.json({ success: candles.length > 0, candles });
  } catch (e) {
    res.json({ success: false, candles: [] });
  }
});

router.get('/api/market/world', async (req, res) => {
  try {
    const data = await getWorld();
    res.json({ success: Object.keys(data).length > 0, tickers: data });
  } catch (e) {
    res.json({ success: false, tickers: {} });
  }
});

module.exports = router;
