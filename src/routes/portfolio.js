const express = require('express');
const router = express.Router();
const { requireInitData } = require('../middleware/auth');
const pool = require('../db/pool');
const { TonClient, Address } = require('@ton/ton');

// Обратный маппинг: адрес контракта -> символ
const JETTON_TO_SYMBOL = {
  'eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds': 'USDT',
  'eqdhyPzbijjt_wny3ggprjsyuk9figmjwmezxO8mziudfb_b': 'BTC', // Приведен к нижнему регистру для сравнения
  'eqa1r_luqclhlmgoo1s4g7y7w1cd0frakba10zq7rddkxi9k': 'XAUt0',
  'eqdsjawfko-6fvzv2eyt-1cazty_zl-pfksid6jeqchnwmdo': 'AAPLx',
  'eqcva-of7acqdu_piadldcbzsf ta-xjwzoctz8zoxbdboab8': 'NVDAx',
  'eqb4iwqwzpuczdntdry8vsn2tsjkt-9f7iib7gefreeyob563': 'TSLAx',
  'eqctd2-7qxhhqonhxri2jszh-dlmwqkycdtlezqri3-56gd9': 'AMZNx',
  'eqb1fybaa9qqdp6legaF3cbu-xbr-p6esbzgnqlhkhihajzv': 'SPYx',
  'eqcvk4oq2l5yts_s7q4j08fb9ftzx3iy-7ui1aqssykgdt_i': 'COINx',
  'eqahz1jk27no5idhrht8146-efz9p4kszzx2h1xxunqoyp_r': 'HOODx',
  'eqbbslyh5sd74gyo4dooj0qshanl81nld13adhkmd0up-46h': 'MSTRx',
  'eqce6utwqromrO_couuvvnykvyecujfugtugvhuwlyvsem7x': 'QQQx',
  'eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not': 'NOT',
  'eqcvxjy4eg8hyhbfsz7eepxrrsuqsfe_jpptraybmcg_dogs': 'DOGS',
  'eqcupm01hldiduq55xabf_1kaw_wauy5dhey8suqzu_major': 'MAJOR',
  'eqbz_cafpydr5kuts0anxh0ztdhkpezonmlja2sngllm4cko': 'REDO',
  'eqbsosmczrd6fhija7qwglw5wo_ah8un435hi935jj_storm': 'STORM',
  'eqd-cvr0nz6xayrbvbhz-abtrrc6si5tvhvvpeqraV9uaad7': 'CATI',
  'eqcaj5oirrrxokysg_b-e0kg9xmwH5upr5i8hqzerm0_blum': 'BLUM'
};

// Исправленные адреса в нижнем регистре для надежного сравнения
const CORRECT_ADDRS = {
  'usdt': 'eqcxe6mutqjkfngfarotkot1lzbdiix1kcixrv7nw2id_sds',
  'btc': 'eqdhyPzbijjt_wny3ggprjsyuk9figmjwmezxO8mziudfb_b',
  'xaut0': 'eqa1r_luqclhlmgoo1s4g7y7w1cd0frakba10zq7rddkxi9k',
  'aaplx': 'eqdsjawfko-6fvzv2eyt-1cazty_zl-pfksid6jeqchnwmdo',
  'nvdax': 'eqcva-of7acqdu_piadldcbzsf ta-xjwzoctz8zoxbdboab8',
  'tslax': 'eqb4iwqwzpuczdntdry8vsn2tsjkt-9f7iib7gefreeyob563',
  'amznx': 'eqctd2-7qxhhqonhxri2jszh-dlmwqkycdtlezqri3-56gd9',
  'spyx': 'eqb1fybaa9qqdp6legaF3cbu-xbr-p6esbzgnqlhkhihajzv',
  'coinx': 'eqcvk4oq2l5yts_s7q4j08fb9ftzx3iy-7ui1aqssykgdt_i',
  'hoodx': 'eqahz1jk27no5idhrht8146-efz9p4kszzx2h1xxunqoyp_r',
  'mstrx': 'eqbbslyh5sd74gyo4dooj0qshanl81nld13adhkmd0up-46h',
  'qqqx': 'eqce6utwqromrO_couuvvnykvyecujfugtugvhuwlyvsem7x',
  'not': 'eqavlwfdxgf2lxm67y4yzc17wykd9a0guwpkms1gosm__not',
  'dogs': 'eqcvxjy4eg8hyhbfsz7eepxrrsuqsfe_jpptraybmcg_dogs',
  'major': 'eqcupm01hldiduq55xabf_1kaw_wauy5dhey8suqzu_major',
  'redo': 'eqbz_cafpydr5kuts0anxh0ztdhkpezonmlja2sngllm4cko',
  'storm': 'eqbsosmczrd6fhija7qwglw5wo_ah8un435hi935jj_storm',
  'cati': 'eqd-cvr0nz6xayrbvbhz-abtrrc6si5tvhvvpeqraV9uaad7',
  'blum': 'eqcaj5oirrrxokysg_b-e0kg9xmwH5upr5i8hqzerm0_blum'
};

const DECIMALS = {
  'USDT': 6, 'BTC': 8, 'XAUt0': 6,
  'AAPLx': 6, 'NVDAx': 6, 'TSLAx': 6, 'AMZNx': 6, 'SPYx': 6,
  'COINx': 8, 'HOODx': 8, 'MSTRx': 8, 'QQQx': 8,
  'NOT': 9, 'DOGS': 9, 'MAJOR': 9, 'REDO': 9, 'STORM': 9, 'CATI': 9, 'BLUM': 9
};

const ICONS = {
  'COGNIQ': '🧠', 'TON': '💎', 'USDT': '💵', 'BTC': '₿', 'XAUt0': '🥇',
  'AAPLx': '🍎', 'NVDAx': '🟩', 'TSLAx': '🚗', 'AMZNx': '📦', 'SPYx': '📈',
  'COINx': '🪙', 'HOODx': '🐕', 'MSTRx': '🚀', 'QQQx': '📊',
  'NOT': '🪙', 'DOGS': '🐶', 'MAJOR': '👑', 'REDO': '🐕', 'STORM': '🌪️', 'CATI': '🐱', 'BLUM': '🌸'
};

const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
  apiKey: process.env.TON_CENTER_API_KEY || ''
});

router.get('/api/wallet/portfolio', requireInitData, async (req, res) => {
  try {
    const userId = req.tgUser.id;
    
    // 1. Данные пользователя из БД
    const userRes = await pool.query('SELECT balance, wallet_address FROM users WHERE telegram_id = $1', [userId]);
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });
    
    const cogniqBalance = parseFloat(userRes.rows[0].balance || 0);
    const walletAddress = userRes.rows[0].wallet_address;

    // 2. Получаем цены с STON.fi (быстро и бесплатно)
    let prices = {};
    try {
      const stonRes = await fetch('https://api.ston.fi/v1/assets');
      if (stonRes.ok) {
        const stonData = await stonRes.json();
        for (const asset of stonData.asset_list) {
          const addr = asset.contract_address.toLowerCase();
          const price = parseFloat(asset.dex_usd_price || asset.third_party_usd_price || 0);
          if (price > 0) prices[addr] = price;
        }
      }
    } catch (e) { console.error('[PORTFOLIO] Ston.fi fetch error:', e.message); }

    // Цена COGNIQ (заглушка, можно заменить на реальную с биржи, когда будет листинг)
    const cogniqPrice = 0.05; 
    let totalUsd = cogniqBalance * cogniqPrice;

    const assets = [{
      symbol: 'COGNIQ', name: 'Cogniq', amount: cogniqBalance, 
      price: cogniqPrice, value: cogniqBalance * cogniqPrice, icon: ICONS['COGNIQ']
    }];

    // 3. Если есть кошелек, читаем балансы
    if (walletAddress) {
      try {
        const addr = Address.parse(walletAddress);
        
        // Баланс TON
        const tonBalanceNano = await client.getBalance(addr);
        const tonBalance = parseFloat(tonBalanceNano) / 1e9;
        // Адрес нативного TON для сравнения цен (если есть в ston.fi)
        const tonPrice = prices['eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c'] || 1.58; 
        totalUsd += tonBalance * tonPrice;
        
        assets.push({
          symbol: 'TON', name: 'Toncoin', amount: tonBalance, 
          price: tonPrice, value: tonBalance * tonPrice, icon: ICONS['TON']
        });

        // Балансы всех Jetton'ов одним запросом v3 API
        const jettonRes = await fetch(`https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(walletAddress)}&limit=100`, {
          headers: { 'X-API-Key': process.env.TON_CENTER_API_KEY || '' }
        });
        
        if (jettonRes.ok) {
          const jettonData = await jettonRes.json();
          const jettons = jettonData.jetton_wallets || [];
          
          for (const jw of jettons) {
            const masterAddr = jw.jetton.address.toLowerCase();
            // Ищем символ по адресу (нормализуем для надежности)
            const symbol = Object.keys(CORRECT_ADDRS).find(key => CORRECT_ADDRS[key] === masterAddr);
            
            if (symbol && DECIMALS[symbol]) {
              const balanceNano = parseInt(jw.balance || '0', 10);
              const amount = balanceNano / Math.pow(10, DECIMALS[symbol]);
              
              if (amount > 0.0001) { // Фильтруем пыль
                const price = prices[masterAddr] || 0;
                const value = amount * price;
                totalUsd += value;
                
                assets.push({
                  symbol: symbol.toUpperCase(),
                  name: symbol.toUpperCase(),
                  amount: amount,
                  price: price,
                  value: value,
                  icon: ICONS[symbol.toUpperCase()] || '🪙'
                });
              }
            }
          }
        }
      } catch (e) {
        console.error('[PORTFOLIO] Wallet balance fetch error:', e.message);
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
