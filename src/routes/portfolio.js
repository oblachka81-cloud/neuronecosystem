const express = require('express');
const router = express.Router();
const { Address } = require('@ton/core');
const { requireInitData } = require('../middleware/auth');
const pool = require('../db/pool');
const exchange = require('../services/exchange');

const ICONS = {
  USDT: '💵', BTC: '₿', XAUt0: '🥇',
  AAPLx: '🍎', NVDAx: '🟩', TSLAx: '🚗', AMZNx: '📦', SPYx: '📈',
  COINx: '🪙', HOODx: '🐦', MSTRx: '🚀', QQQx: '📊',
  NOT: '🪙', DOGS: '🐶', MAJOR: '👑', REDO: '🐕', STORM: '🌪️', CATI: '🐱', BLUM: '🌸',
  TON: '💎', COGNIQ: '🧠', GRAM: '💎'
};

// ===== АВТОМАТИЧЕСКАЯ КАРТА АДРЕСОВ из exchange.TOKEN_MAP =====
const JETTON_MAP = {};
for (const [symbol, address] of Object.entries(exchange.TOKEN_MAP || {})) {
  try {
    const raw = Address.parse(address).toRawString().toLowerCase();
    JETTON_MAP[raw] = {
      symbol: symbol,
      decimals: exchange.DECIMALS?.[symbol] || 9,
      name: symbol,
      icon: ICONS[symbol] || '🪙'
    };
  } catch (e) { /* пропускаем битый адрес */ }
}
// ===== COGNIQ он-чейн (выведенные жетоны в кошельке) =====
try {
  const COGNIQ_MASTER = 'EQDOjRZ5rbSnBBvhsv4g0JNN67p89617_2pNc_AO1dTEkaNg';
  const cogniqRaw = Address.parse(COGNIQ_MASTER).toRawString().toLowerCase();
  JETTON_MAP[cogniqRaw] = {
    symbol: 'COGNIQ (wallet)',
    decimals: 9,
    name: 'COGNIQ (wallet)',
    icon: '🧠'
  };
} catch (e) {}

const TON_RAW = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c').toRawString().toLowerCase();

// ===== ПЕРЕВОДЫ =====
const T = {
  ru: { title: 'ОБЩАЯ ОЦЕНКА', assets: 'АКТИВЫ', back: '← Назад к кошельку', empty: 'Ваш портфель пока пуст', emptyDesc: 'Начните собирать капитал, играя в викторину или торгуя на бирже!', playBtn: 'Играть в викторину', exchangeBtn: 'Перейти на биржу', units: 'шт.', loading: 'Загрузка портфеля...', error: 'Ошибка загрузки', listingTitle: 'Листинг COGNIQ', listingDesc: 'COGNIQ будет листиться на ведущих DEX (STON.fi, DeDust) в Q1-Q2 2027 и на CEX в Q3-Q4 2027 года.', yourBalance: 'Твой баланс', dexListing: 'DEX Listing', cexListing: 'CEX Listing' },
  en: { title: 'TOTAL VALUE', assets: 'ASSETS', back: '← Back to wallet', empty: 'Your portfolio is empty', emptyDesc: 'Start building wealth by playing the quiz or trading on the exchange!', playBtn: 'Play Quiz', exchangeBtn: 'Go to Exchange', units: 'units', loading: 'Loading portfolio...', error: 'Load error', listingTitle: 'COGNIQ Listing', listingDesc: 'COGNIQ will be listed on leading DEXs (STON.fi, DeDust) in Q1-Q2 2027 and on CEXs in Q3-Q4 2027.', yourBalance: 'Your Balance', dexListing: 'DEX Listing', cexListing: 'CEX Listing' },
  fr: { title: 'VALEUR TOTALE', assets: 'ACTIFS', back: '← Retour', empty: 'Portefeuille vide', emptyDesc: 'Commencez à jouer ou trader !', playBtn: 'Jouer', exchangeBtn: 'Bourse', units: 'unités', loading: 'Chargement...', error: 'Erreur', listingTitle: 'Listing COGNIQ', listingDesc: 'COGNIQ sera listé sur DEX (Q1-Q2 2027) et CEX (Q3-Q4 2027).', yourBalance: 'Solde', dexListing: 'DEX', cexListing: 'CEX' },
  es: { title: 'VALOR TOTAL', assets: 'ACTIVOS', back: '← Volver', empty: 'Tu portafolio está vacío', emptyDesc: '¡Empieza a jugar o tradear!', playBtn: 'Jugar', exchangeBtn: 'Exchange', units: 'uds.', loading: 'Cargando...', error: 'Error', listingTitle: 'Listado COGNIQ', listingDesc: 'COGNIQ se listará en DEX (Q1-Q2 2027) y CEX (Q3-Q4 2027).', yourBalance: 'Balance', dexListing: 'DEX', cexListing: 'CEX' }
};

// ===== ЦЕНЫ СО STON.FI =====
async function getPricesFromStonFi() {
  const prices = {};
  try {
    const res = await fetch('https://api.ston.fi/v1/assets');
    if (res.ok) {
      const data = await res.json();
      for (const asset of data.asset_list || []) {
        try {
          const addr = Address.parse(asset.contract_address).toRawString().toLowerCase();
          const price = parseFloat(asset.dex_usd_price || asset.third_party_usd_price || '0');
          if (price > 0) prices[addr] = price;
        } catch (e) { continue; }
      }
    }
  } catch (e) {
    console.error('[PORTFOLIO] STON.fi prices error:', e.message);
  }
  return prices;
}

// ===== РОУТ =====
router.get('/api/wallet/portfolio', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const lang = req.query.lang || (req.tgUser && req.tgUser.language_code) || 'en';
    const t = T[lang] || T.en;
    const walletAddress = req.query.wallet_address;

    const userRes = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
    const cogniqBalance = parseFloat(userRes.rows[0].balance || 0);

    const prices = await getPricesFromStonFi();
    const assets = [];
    let totalUsd = 0;

    // COGNIQ из БД (цена 0 до листинга)
    assets.push({ symbol: 'COGNIQ', name: 'Cogniq', amount: cogniqBalance, price: 0, value: 0, icon: '🧠' });

    if (walletAddress) {
      try {
        // Баланс TON
        const tonRes = await fetch(`https://toncenter.com/api/v3/addressInformation?address=${encodeURIComponent(walletAddress)}`, {
          headers: { 'X-API-Key': process.env.TON_CENTER_API_KEY || '' }
        });
        if (tonRes.ok) {
          const tonData = await tonRes.json();
          const tonBalance = parseInt((tonData && tonData.balance) || '0', 10) / 1e9;
          const tonPrice = prices[TON_RAW] || 1.58;
          const tonValue = tonBalance * tonPrice;
          totalUsd += tonValue;
          assets.push({ symbol: 'TON', name: 'Toncoin', amount: tonBalance, price: tonPrice, value: tonValue, icon: '💎' });
        }

        // Все жетоны кошелька
        const jettonRes = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(walletAddress)}&limit=100`, {
          headers: { 'X-API-Key': process.env.TON_CENTER_API_KEY || '' }
        });
        if (jettonRes.ok) {
          const jettonData = await jettonRes.json();
          const jettons = jettonData.jetton_wallets || [];
          console.log(`[PORTFOLIO] Найдено жетонов: ${jettons.length}, в карте: ${Object.keys(JETTON_MAP).length}`);

          for (const jw of jettons) {
            const masterRaw = String(typeof jw.jetton === 'string' ? jw.jetton : ((jw.jetton && jw.jetton.address) || '')).toLowerCase();
            if (!masterRaw) continue;

            const info = JETTON_MAP[masterRaw];
            if (!info) {
              console.log(`[PORTFOLIO] Неизвестный жетон: ${masterRaw}, баланс: ${jw.balance}`);
              continue;
            }

            const amount = parseInt(jw.balance || '0', 10) / Math.pow(10, info.decimals);
            if (amount > 0) {
              const price = prices[masterRaw] || 0;
              const value = amount * price;
              totalUsd += value;
              console.log(`[PORTFOLIO] Добавлен ${info.symbol}: amount=${amount}, price=${price}`);
              assets.push({ symbol: info.symbol, name: info.name, amount: amount, price: price, value: value, icon: info.icon });
            }
          }
        } else {
          console.error(`[PORTFOLIO] Jetton API ошибка: ${jettonRes.status}`);
        }
      } catch (e) {
        console.error('[PORTFOLIO] Wallet fetch error:', e.message);
      }
    }

    assets.sort((a, b) => b.value - a.value);

    res.json({ success: true, total_usd: totalUsd, assets: assets, texts: t });
  } catch (err) {
    console.error('[PORTFOLIO] Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
