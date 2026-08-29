const express = require('express');
const router = express.Router();
const { requireInitData } = require('../middleware/auth');
const pool = require('../db/pool');

// Маппинг адресов контрактов -> символы (в нижнем регистре)
const JETTON_SYMBOLS = {
  'eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds': { symbol: 'USDT', name: 'Tether USD', decimals: 6, icon: '💵' },
  'eqdhyPzbijjt_wny3ggprjsyuk9figmjwmezxO8mziudfb_b': { symbol: 'BTC', name: 'Bitcoin', decimals: 8, icon: '₿' },
  'eqa1r_luqclhlmgoo1s4g7y7w1cd0frakba10zq7rddkxi9k': { symbol: 'XAUt0', name: 'Tether Gold', decimals: 6, icon: '🥇' },
  'eqdsjawfko-6fvzv2eyt-1cazty_zl-pfksid6jeqchnwmdo': { symbol: 'AAPLx', name: 'Apple', decimals: 6, icon: '🍎' },
  'eqcva-of7acqdu_piadldcbzsfta-xjwzoctz8zoxbdboab8': { symbol: 'NVDAx', name: 'NVIDIA', decimals: 6, icon: '🟩' },
  'eqb4iwqwzpuczdntdry8vsn2tsjkt-9f7iib7gefreeyob563': { symbol: 'TSLAx', name: 'Tesla', decimals: 6, icon: '🚗' },
  'eqctd2-7qxhhqonhxri2jszh-dlmwqkycdtlezqri3-56gd9': { symbol: 'AMZNx', name: 'Amazon', decimals: 6, icon: '📦' },
  'eqb1fybaa9qqdp6legaF3cbu-xbr-p6esbzgnqlhkhihajzv': { symbol: 'SPYx', name: 'S&P 500', decimals: 6, icon: '📈' },
  'eqcvk4oq2l5yts_s7q4j08fb9ftzx3iy-7ui1aqssykgdt_i': { symbol: 'COINx', name: 'Coinbase', decimals: 8, icon: '🪙' },
  'eqahz1jk27no5idhrht8146-efz9p4kszzx2h1xxunqoyp_r': { symbol: 'HOODx', name: 'Robinhood', decimals: 8, icon: '' },
  'eqbbslyh5sd74gyo4dooj0qshanl81nld13adhkmd0up-46h': { symbol: 'MSTRx', name: 'MicroStrategy', decimals: 8, icon: '🚀' },
  'eqce6utwqromrO_couuvvnykvyecujfugtugvhuwlyvsem7x': { symbol: 'QQQx', name: 'Nasdaq-100', decimals: 8, icon: '📊' },
  'eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not': { symbol: 'NOT', name: 'Notcoin', decimals: 9, icon: '🪙' },
  'eqcvxjy4eg8hyhbfsz7eepxrrsuqsfe_jpptraybmcg_dogs': { symbol: 'DOGS', name: 'Dogs', decimals: 9, icon: '🐶' },
  'eqcupm01hldiduq55xabf_1kaw_wauy5dhey8suqzu_major': { symbol: 'MAJOR', name: 'Major', decimals: 9, icon: '👑' },
  'eqbz_cafpydr5kuts0anxh0ztdhkpezonmlja2sngllm4cko': { symbol: 'REDO', name: 'Resistance Dog', decimals: 9, icon: '🐕' },
  'eqbsosmczrd6fhija7qwglw5wo_ah8un435hi935jj_storm': { symbol: 'STORM', name: 'Storm Trade', decimals: 9, icon: '️' },
  'eqd-cvr0nz6xayrbvbhz-abtrrc6si5tvhvvpeqraV9uaad7': { symbol: 'CATI', name: 'Catizen', decimals: 9, icon: '' },
  'eqcaj5oirrrxokysg_b-e0kg9xmwH5upr5i8hqzerm0_blum': { symbol: 'BLUM', name: 'Blum', decimals: 9, icon: '' }
};

// Переводы
const T = {
  ru: { 
    title: 'ОБЩАЯ ОЦЕНКА', 
    assets: 'АКТИВЫ', 
    back: '← Назад к кошельку', 
    empty: 'Ваш портфель пока пуст', 
    emptyDesc: 'Начните собирать капитал, играя в викторину или торгуя на бирже!', 
    playBtn: 'Играть в викторину', 
    exchangeBtn: 'Перейти на биржу', 
    units: 'шт.', 
    loading: 'Загрузка портфеля...', 
    error: 'Ошибка загрузки',
    listingTitle: 'Листинг COGNIQ',
    listingDesc: 'COGNIQ будет листиться на ведущих DEX (STON.fi, DeDust) в Q1-Q2 2027 и на CEX в Q3-Q4 2027 года.',
    yourBalance: 'Твой баланс',
    dexListing: 'DEX Listing',
    cexListing: 'CEX Listing'
  },
  en: { 
    title: 'TOTAL VALUE', 
    assets: 'ASSETS', 
    back: '← Back to wallet', 
    empty: 'Your portfolio is empty', 
    emptyDesc: 'Start building wealth by playing the quiz or trading on the exchange!', 
    playBtn: 'Play Quiz', 
    exchangeBtn: 'Go to Exchange', 
    units: 'units', 
    loading: 'Loading portfolio...', 
    error: 'Load error',
    listingTitle: 'COGNIQ Listing',
    listingDesc: 'COGNIQ will be listed on leading DEXs (STON.fi, DeDust) in Q1-Q2 2027 and on CEXs in Q3-Q4 2027.',
    yourBalance: 'Your Balance',
    dexListing: 'DEX Listing',
    cexListing: 'CEX Listing'
  },
  fr: { 
    title: 'VALEUR TOTALE', 
    assets: 'ACTIFS', 
    back: '← Retour', 
    empty: 'Portefeuille vide', 
    emptyDesc: 'Commencez à jouer ou trader !', 
    playBtn: 'Jouer', 
    exchangeBtn: 'Bourse', 
    units: 'unités', 
    loading: 'Chargement...', 
    error: 'Erreur',
    listingTitle: 'Listing COGNIQ',
    listingDesc: 'COGNIQ sera listé sur DEX (Q1-Q2 2027) et CEX (Q3-Q4 2027).',
    yourBalance: 'Solde',
    dexListing: 'DEX',
    cexListing: 'CEX'
  },
  es: { 
    title: 'VALOR TOTAL', 
    assets: 'ACTIVOS', 
    back: '← Volver', 
    empty: 'Portafolio vacío', 
    emptyDesc: '¡Empieza a jugar o tradear!', 
    playBtn: 'Jugar', 
    exchangeBtn: 'Exchange', 
    units: 'uds.', 
    loading: 'Cargando...', 
    error: 'Error',
    listingTitle: 'Listado COGNIQ',
    listingDesc: 'COGNIQ se listará en DEX (Q1-Q2 2027) y CEX (Q3-Q4 2027).',
    yourBalance: 'Balance',
    dexListing: 'DEX',
    cexListing: 'CEX'
  }
};

// Получение цен с STON.fi
async function getPricesFromStonFi() {
  const prices = {};
  try {
    const res = await fetch('https://api.ston.fi/v1/assets');
    if (res.ok) {
      const data = await res.json();
      for (const asset of data.asset_list || []) {
        const addr = (asset.contract_address || '').toLowerCase();
        const price = parseFloat(asset.dex_usd_price || asset.third_party_usd_price || '0');
        if (price > 0) prices[addr] = price;
      }
    }
  } catch (e) {
    console.error('[PORTFOLIO] STON.fi prices error:', e.message);
  }
  return prices;
}

router.get('/api/wallet/portfolio', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const lang = req.query.lang || req.tgUser?.language_code || 'en';
    const t = T[lang] || T.en;
    const walletAddress = req.query.wallet_address;

    // 1. Баланс COGNIQ из БД
    const userRes = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
    const cogniqBalance = parseFloat(userRes.rows[0].balance || 0);

    // 2. Получаем реальные цены
    const prices = await getPricesFromStonFi();

    const assets = [];
    let totalUsd = 0;

    // COGNIQ (реальная цена если есть, иначе 0)
    const cogniqPrice = prices['cogniq'] || 0;
    const cogniqValue = cogniqBalance * cogniqPrice;
    totalUsd += cogniqValue;
    assets.push({
      symbol: 'COGNIQ', name: 'Cogniq', amount: cogniqBalance,
      price: cogniqPrice, value: cogniqValue, icon: '🧠'
    });

    // 3. Если есть адрес кошелька — читаем балансы
    if (walletAddress) {
      try {
        // Баланс TON
        const tonRes = await fetch(`https://toncenter.com/api/v3/addressInformation?address=${encodeURIComponent(walletAddress)}`, {
          headers: { 'X-API-Key': process.env.TON_CENTER_API_KEY || '' }
        });
        if (tonRes.ok) {
          const tonData = await tonRes.json();
          const tonBalanceNano = parseInt(tonData?.balance || '0', 10);
          const tonBalance = tonBalanceNano / 1e9;
          const tonAddr = 'eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c';
          const tonPrice = prices[tonAddr] || 1.58;
          const tonValue = tonBalance * tonPrice;
          totalUsd += tonValue;
          assets.push({
            symbol: 'TON', name: 'Toncoin', amount: tonBalance,
            price: tonPrice, value: tonValue, icon: '💎'
          });
        }

        // Все Jetton балансы
        const jettonRes = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(walletAddress)}&limit=100`, {
          headers: { 'X-API-Key': process.env.TON_CENTER_API_KEY || '' }
        });
        if (jettonRes.ok) {
          const jettonData = await jettonRes.json();
          const jettons = jettonData.jetton_wallets || [];

          for (const jw of jettons) {
            const masterAddr = jw.jetton?.address?.toLowerCase();
            if (!masterAddr) continue;

            const info = JETTON_SYMBOLS[masterAddr];
            if (!info) continue;

            const balanceNano = parseInt(jw.balance || '0', 10);
            const amount = balanceNano / Math.pow(10, info.decimals);

            if (amount > 0) {
              const price = prices[masterAddr] || 0;
              const value = amount * price;
              totalUsd += value;

              assets.push({
                symbol: info.symbol,
                name: info.name,
                amount: amount,
                price: price,
                value: value,
                icon: info.icon
              });
            }
          }
        }
      } catch (e) {
        console.error('[PORTFOLIO] Wallet fetch error:', e.message);
      }
    }

    // Сортируем по стоимости
    assets.sort((a, b) => b.value - a.value);

    res.json({ 
      success: true, 
      total_usd: totalUsd, 
      assets: assets,
      texts: t
    });

  } catch (err) {
    console.error('[PORTFOLIO] Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
