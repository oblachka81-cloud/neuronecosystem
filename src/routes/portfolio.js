const express = require('express');
const router = express.Router();
const { requireInitData } = require('../middleware/auth');
const pool = require('../db/pool');
const { Address } = require('@ton/ton');

// Маппинг адресов контрактов -> символы (в нижнем регистре)
const JETTON_SYMBOLS = {
  'eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds': { symbol: 'USDT', name: 'Tether USD', decimals: 6, icon: '💵' },
  'eqdhyPzbijjt_wny3ggprjsyuk9figmjwmezxO8mziudfb_b': { symbol: 'BTC', name: 'Bitcoin', decimals: 8, icon: '₿' },
  'eqa1r_luqclhlmgoo1s4g7y7w1cd0frakba10zq7rddkxi9k': { symbol: 'XAUt0', name: 'Tether Gold', decimals: 6, icon: '🥇' },
  'eqdsjawfko-6fvzv2eyt-1cazty_zl-pfksid6jeqchnwmdo': { symbol: 'AAPLx', name: 'Apple', decimals: 6, icon: '🍎' },
  'eqcva-of7acqdu_piadldcbzsfta-xjwzoctz8zoxbdboab8': { symbol: 'NVDAx', name: 'NVIDIA', decimals: 6, icon: '' },
  'eqb4iwqwzpuczdntdry8vsn2tsjkt-9f7iib7gefreeyob563': { symbol: 'TSLAx', name: 'Tesla', decimals: 6, icon: '' },
  'eqctd2-7qxhhqonhxri2jszh-dlmwqkycdtlezqri3-56gd9': { symbol: 'AMZNx', name: 'Amazon', decimals: 6, icon: '📦' },
  'eqb1fybaa9qqdp6legaF3cbu-xbr-p6esbzgnqlhkhihajzv': { symbol: 'SPYx', name: 'S&P 500', decimals: 6, icon: '📈' },
  'eqcvk4oq2l5yts_s7q4j08fb9ftzx3iy-7ui1aqssykgdt_i': { symbol: 'COINx', name: 'Coinbase', decimals: 8, icon: '🪙' },
  'eqahz1jk27no5idhrht8146-efz9p4kszzx2h1xxunqoyp_r': { symbol: 'HOODx', name: 'Robinhood', decimals: 8, icon: '🐕' },
  'eqbbslyh5sd74gyo4dooj0qshanl81nld13adhkmd0up-46h': { symbol: 'MSTRx', name: 'MicroStrategy', decimals: 8, icon: '🚀' },
  'eqce6utwqromrO_couuvvnykvyecujfugtugvhuwlyvsem7x': { symbol: 'QQQx', name: 'Nasdaq-100', decimals: 8, icon: '📊' },
  'eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not': { symbol: 'NOT', name: 'Notcoin', decimals: 9, icon: '🪙' },
  'eqcvxjy4eg8hyhbfsz7eepxrrsuqsfe_jpptraybmcg_dogs': { symbol: 'DOGS', name: 'Dogs', decimals: 9, icon: '' },
  'eqcupm01hldiduq55xabf_1kaw_wauy5dhey8suqzu_major': { symbol: 'MAJOR', name: 'Major', decimals: 9, icon: '👑' },
  'eqbz_cafpydr5kuts0anxh0ztdhkpezonmlja2sngllm4cko': { symbol: 'REDO', name: 'Resistance Dog', decimals: 9, icon: '🐕' },
  'eqbsosmczrd6fhija7qwglw5wo_ah8un435hi935jj_storm': { symbol: 'STORM', name: 'Storm Trade', decimals: 9, icon: '🌪️' },
  'eqd-cvr0nz6xayrbvbhz-abtrrc6si5tvhvvpeqraV9uaad7': { symbol: 'CATI', name: 'Catizen', decimals: 9, icon: '🐱' },
  'eqcaj5oirrrxokysg_b-e0kg9xmwH5upr5i8hqzerm0_blum': { symbol: 'BLUM', name: 'Blum', decimals: 9, icon: '🌸' }
};

// Цены-заглушки (пока нет реального листинга COGNIQ)
const FALLBACK_PRICES = {
  'COGNIQ': 0.05,
  'TON': 1.58,
  'USDT': 1.0,
  'BTC': 60906,
  'XAUt0': 2400,
  'NOT': 0.00043,
  'DOGS': 0.000004,
  'MAJOR': 0.041,
  'REDO': 0.083,
  'STORM': 0.0044,
  'CATI': 0.054,
  'BLUM': 0.00157,
  'AAPLx': 225,
  'NVDAx': 125,
  'TSLAx': 250,
  'AMZNx': 185,
  'SPYx': 560,
  'COINx': 240,
  'HOODx': 35,
  'MSTRx': 1800,
  'QQQx': 480
};

router.get('/api/wallet/portfolio', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    const walletAddress = req.query.wallet_address;

    // 1. Баланс COGNIQ из БД
    const userRes = await pool.query('SELECT balance FROM users WHERE telegram_id = $1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
    const cogniqBalance = parseFloat(userRes.rows[0].balance || 0);

    const assets = [];
    let totalUsd = 0;

    // Добавляем COGNIQ
    const cogniqPrice = FALLBACK_PRICES['COGNIQ'];
    const cogniqValue = cogniqBalance * cogniqPrice;
    totalUsd += cogniqValue;
    assets.push({
      symbol: 'COGNIQ', name: 'Cogniq', amount: cogniqBalance,
      price: cogniqPrice, value: cogniqValue, icon: '🧠'
    });

    // 2. Если есть адрес кошелька — читаем балансы
    if (walletAddress) {
      try {
        // Баланс TON через toncenter v3
        const tonRes = await fetch(`https://toncenter.com/api/v3/addressInformation?address=${encodeURIComponent(walletAddress)}`, {
          headers: { 'X-API-Key': process.env.TON_CENTER_API_KEY || '' }
        });
        if (tonRes.ok) {
          const tonData = await tonRes.json();
          const tonBalanceNano = parseInt(tonData?.balance || '0', 10);
          const tonBalance = tonBalanceNano / 1e9;
          const tonPrice = FALLBACK_PRICES['TON'];
          const tonValue = tonBalance * tonPrice;
          totalUsd += tonValue;
          assets.push({
            symbol: 'TON', name: 'Toncoin', amount: tonBalance,
            price: tonPrice, value: tonValue, icon: '💎'
          });
        }

        // Все Jetton балансы одним запросом
        const jettonRes = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(walletAddress)}&limit=100`, {
          headers: { 'X-API-Key': process.env.TON_CENTER_API_KEY || '' }
        });
        if (jettonRes.ok) {
          const jettonData = await jettonRes.json();
          const jettons = jettonData.jetton_wallets || [];

          for (const jw of jettons) {
            const masterAddr = jw.jetton?.address?.toLowerCase();
            if (!masterAddr) continue;

            const tokenInfo = Object.values(JETTON_SYMBOLS).find(t => {
              // Ищем по адресу (нужно нормализовать)
              const keys = Object.keys(JETTON_SYMBOLS);
              return keys.find(k => JETTON_SYMBOLS[k] === t) === masterAddr;
            });

            // Прямой поиск по адресу
            let symbol = null;
            for (const [addr, info] of Object.entries(JETTON_SYMBOLS)) {
              if (addr === masterAddr) {
                symbol = info.symbol;
                break;
              }
            }

            if (symbol) {
              const info = JETTON_SYMBOLS[Object.keys(JETTON_SYMBOLS).find(k => JETTON_SYMBOLS[k].symbol === symbol)];
              const balanceNano = parseInt(jw.balance || '0', 10);
              const amount = balanceNano / Math.pow(10, info.decimals);

              if (amount > 0.0001) {
                const price = FALLBACK_PRICES[symbol] || 0;
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
        }
      } catch (e) {
        console.error('[PORTFOLIO] Wallet fetch error:', e.message);
      }
    }

    // Сортируем по стоимости (самые дорогие сверху)
    assets.sort((a, b) => b.value - a.value);

    res.json({ success: true, total_usd: totalUsd, assets: assets });

  } catch (err) {
    console.error('[PORTFOLIO] Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
