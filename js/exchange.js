// ==================== БИРЖА ====================
const LISTING_TEXTS = {
  ru: 'Листинг COGNIQ запланирован на III-IV квартал 2026 года. Точная дата будет объявлена дополнительно. Следите за новостями в нашем Telegram-канале.',
  en: 'COGNIQ listing is scheduled for Q3-Q4 2026. Exact date to be announced. Follow our Telegram channel for updates.',
  fr: 'Le listing COGNIQ est prévu pour Q3-Q4 2026. La date exacte sera annoncée. Suivez notre canal Telegram.',
  es: 'El listing de COGNIQ está previsto para Q3-Q4 2026. La fecha exacta será anunciada. Sigue nuestro canal de Telegram.'
};

const EXCHANGE_LANG = {
  ru: {
    walletLabel: 'Подключённый кошелёк',
    notConnected: 'Не подключён',
    connectBtn: 'Подключить',
    fromLabel: 'Отдаю',
    toLabel: 'Получу',
    rateLabel: 'Курс:',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 История сделок',
    noHistory: 'Пока нет сделок',
    completed: '✓ Готово',
    pending: '⏳ Ожидание',
    toastConnected: 'Кошелёк подключён!',
    toastNotLoaded: 'TON Connect не загружен',
    toastSwapOk: '✅ Обмен выполнен!',
    toastNeedWallet: 'Сначала подключите кошелёк',
    toastEnterAmount: 'Введите сумму',
    fiatBtn: '💳 Купить / Продать crypto',
  },
  en: {
    walletLabel: 'Connected Wallet',
    notConnected: 'Not connected',
    connectBtn: 'Connect',
    fromLabel: 'From',
    toLabel: 'To',
    rateLabel: 'Rate:',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 Transaction History',
    noHistory: 'No transactions yet',
    completed: '✓ Completed',
    pending: '⏳ Pending',
    toastConnected: 'Wallet connected!',
    toastNotLoaded: 'TON Connect not loaded',
    toastSwapOk: '✅ Exchange completed!',
    toastNeedWallet: 'Connect wallet first',
    toastEnterAmount: 'Enter amount',
    fiatBtn: '💳 Buy / Sell crypto',
  },
  fr: {
    walletLabel: 'Portefeuille connecté',
    notConnected: 'Non connecté',
    connectBtn: 'Connecter',
    fromLabel: 'Donner',
    toLabel: 'Recevoir',
    rateLabel: 'Taux :',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 Historique',
    noHistory: 'Aucune transaction',
    completed: '✓ Terminé',
    pending: '⏳ En attente',
    toastConnected: 'Portefeuille connecté !',
    toastNotLoaded: 'TON Connect non chargé',
    toastSwapOk: '✅ Échange terminé !',
    toastNeedWallet: 'Connectez d\'abord le portefeuille',
    toastEnterAmount: 'Entrez le montant',
    fiatBtn: '💳 Acheter / Vendre crypto',
  },
  es: {
    walletLabel: 'Cartera conectada',
    notConnected: 'No conectada',
    connectBtn: 'Conectar',
    fromLabel: 'Dar',
    toLabel: 'Recibir',
    rateLabel: 'Tasa:',
    gasFeeLabel: 'Gas fee=5 COGNIQ',
    historyTitle: '📋 Historial',
    noHistory: 'Sin transacciones',
    completed: '✓ Completado',
    pending: '⏳ Pendiente',
    toastConnected: '¡Cartera conectada!',
    toastNotLoaded: 'TON Connect no cargado',
    toastSwapOk: '✅ ¡Intercambio completado!',
    toastNeedWallet: 'Conecta la cartera primero',
    toastEnterAmount: 'Ingresa el monto',
    fiatBtn: '💳 Comprar / Vender crypto',
  }
};

let exchangeRates = {};
let exchangeWalletConnected = false;
let exchangeWalletAddress = '';

function showListingInfo() {
  const modal = document.getElementById('listingModal');
  const textEl = document.getElementById('listingInfoText');
  textEl.textContent = LISTING_TEXTS[currentLang] || LISTING_TEXTS['en'];
  modal.style.display = 'flex';
}

async function exchangeLoadRates() {
  try {
    const res = await fetch(`${BASE_URL}/api/exchange/rates`);
    const data = await res.json();
    if (data.success) {
      exchangeRates = data.rates;
      exchangeRenderPairs();
      exchangeCalcSwap();
    }
  } catch (e) {
    console.error('Rates error:', e);
  }
}

function exchangeCalcSwap() {
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;
  const amount = parseFloat(document.getElementById('fromAmount').value) || 0;
  const pair = `${from}/${to}`;
  const rate = exchangeRates[pair];
  if (rate && amount > 0) {
    const raw = amount * rate;
    const fee = raw * 0.003;
    const result = raw - fee;
    document.getElementById('toAmount').value = result.toFixed(6);
    document.getElementById('rateInfo').textContent = `1 ${from} = ${rate.toFixed(6)} ${to}`;
    document.getElementById('swapBtn').disabled = !exchangeWalletConnected;
  } else {
    document.getElementById('toAmount').value = '';
    document.getElementById('rateInfo').textContent = '—';
    document.getElementById('swapBtn').disabled = true;
  }
}

function exchangeSwapCurrencies() {
  const from = document.getElementById('fromCurrency');
  const to = document.getElementById('toCurrency');
  const tmp = from.value;
  from.value = to.value;
  to.value = tmp;
  exchangeCalcSwap();
}

async function exchangeConnectWallet() {
  if (!tonConnectUI) initTonConnect();
  if (!tonConnectUI) { showToast(EXCHANGE_LANG[currentLang].toastNotLoaded); return; }
  
  const wallet = tonConnectUI.wallet;
  if (wallet) {
    exchangeWalletConnected = true;
    exchangeWalletAddress = wallet.account.address;
    localStorage.setItem('walletAddress', exchangeWalletAddress);
    localStorage.setItem('walletConnected', 'true');
    document.getElementById('walletAddr').textContent = exchangeWalletAddress.slice(0,6) + '...' + exchangeWalletAddress.slice(-4);
    document.getElementById('swapBtn').disabled = false;
    showToast(EXCHANGE_LANG[currentLang].toastConnected);
  } else {
    try {
      await tonConnectUI.openModal();
    } catch(e) {
      showToast('Не удалось подключить кошелёк');
    }
  }
}

function hexToBase64(hex) {
  if (!hex) return '';
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length === 0 || clean.length % 2 !== 0) return '';
  let binary = '';
  for (let i = 0; i < clean.length; i += 2) {
    binary += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
  }
  return btoa(binary);
}

async function exchangeDoSwap() {
  if (!exchangeWalletConnected) { showToast(EXCHANGE_LANG[currentLang].toastNeedWallet); return; }
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;
  const amount = parseFloat(document.getElementById('fromAmount').value);
  if (!amount || amount <= 0) { showToast(EXCHANGE_LANG[currentLang].toastEnterAmount); return; }
  
  const btn = document.getElementById('swapBtn');
  btn.disabled = true;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/exchange/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCurrency: from, toCurrency: to, fromAmount: amount })
    });
    const data = await res.json();
    
    if (data.success) {
      showToast(`Сделка создана. Комиссия: ${data.fee.toFixed(6)} ${to} + 5 COGNIQ (gas).`);
      
      const swapDataRes = await authFetch(`${BASE_URL}/api/exchange/swap-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCurrency: from, toCurrency: to, fromAmount: amount, walletAddress: exchangeWalletAddress })
      });
      const swapData = await swapDataRes.json();

      if (!swapData.success) {
        if (swapData.error && swapData.error.includes('COGNIQ')) {
          showToast('Недостаточно COGNIQ! Нужно ' + (swapData.required || 5) + '. Баланс: ' + (swapData.balance || 0));
        } else {
          showToast('Ошибка свопа');
        }
        return;
      }
      if (!swapData.messages?.length) {
        showToast('Ошибка свопа');
        return;
      }

      const validMessages = swapData.messages.map(m => {
        const msg = { address: m.address, amount: String(m.amount) };
        if (m.payload && m.payload.length > 0) {
          const isHex = /^[0-9a-fA-F]+$/.test(m.payload);
          msg.payload = isHex ? hexToBase64(m.payload) : m.payload;
        }
        if (m.stateInit && m.stateInit.length > 0) {
          const isHex = /^[0-9a-fA-F]+$/.test(m.stateInit);
          msg.stateInit = isHex ? hexToBase64(m.stateInit) : m.stateInit;
        }
        return msg;
      });

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: validMessages
      };

      await tonConnectUI.sendTransaction(transaction);
      
      try {
        await authFetch(`${BASE_URL}/api/exchange/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ swapId: data.swapId })
        });
      } catch (e) {
        console.error('Confirm failed:', e);
      }
      
      showToast(EXCHANGE_LANG[currentLang].toastSwapOk);
      exchangeLoadHistory();
    }
  } catch (err) {
    console.error('Swap error:', err);
    showToast('❌ Ошибка: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

const EXCHANGE_CRYPTO_PAIRS = [
  { name: 'TON/USDT', from: 'TON', to: 'USDT' },
  { name: 'USDT/TON', from: 'USDT', to: 'TON' },
  { name: 'BTC/USDT', from: 'BTC', to: 'USDT' },
  { name: 'BTC/TON', from: 'BTC', to: 'TON' },
  { name: 'XAUt0/USDT', from: 'XAUt0', to: 'USDT' },
  { name: 'USDT/XAUt0', from: 'USDT', to: 'XAUt0' }
];

const EXCHANGE_XSTOCKS_PAIRS = [
  { name: 'AAPLx/USDT', from: 'AAPLx', to: 'USDT' },
  { name: 'USDT/AAPLx', from: 'USDT', to: 'AAPLx' },
  { name: 'NVDAx/USDT', from: 'NVDAx', to: 'USDT' },
  { name: 'USDT/NVDAx', from: 'USDT', to: 'NVDAx' },
  { name: 'TSLAx/USDT', from: 'TSLAx', to: 'USDT' },
  { name: 'USDT/TSLAx', from: 'USDT', to: 'TSLAx' },
  { name: 'AMZNx/USDT', from: 'AMZNx', to: 'USDT' },
  { name: 'USDT/AMZNx', from: 'USDT', to: 'AMZNx' },
  { name: 'SPYx/USDT', from: 'SPYx', to: 'USDT' },
  { name: 'USDT/SPYx', from: 'USDT', to: 'SPYx' }
];

function exchangeRenderPairs() {
  exchangeRenderPairGrid('pairsCrypto', EXCHANGE_CRYPTO_PAIRS);
  exchangeRenderPairGrid('pairsXstocks', EXCHANGE_XSTOCKS_PAIRS);
}

function exchangeRenderPairGrid(id, pairsList) {
  const grid = document.getElementById(id);
  const isXstocks = (id === 'pairsXstocks');
  grid.innerHTML = pairsList.map(p => {
    const rate = exchangeRates[`${p.from}/${p.to}`];
    return `<div class="pair-card" onclick="exchangeSelectPair('${p.from}','${p.to}')" style="position:relative;background:none;border:none;padding:0;">
      <img src="/public/images/cogniq/exchange_pair_card.png" style="width:100%;display:block;">
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:center;padding:0 36px 0 12px;">
        <div style="font-size:0.8rem;font-weight:600;color:#ffcc44;margin-bottom:4px;">${p.name}</div>
        <div style="font-size:0.75rem;color:#ffcc44;">${rate ? rate.toFixed(4) : '—'}</div>
      </div>
    </div>`;
  }).join('');
}

function exchangeSwitchPairTab(tab) {
  const crypto = document.getElementById('pairsCrypto');
  const xstocks = document.getElementById('pairsXstocks');
  const tabCryptoImg = document.querySelector('#tabCrypto img');
  const tabXstocksImg = document.querySelector('#tabXstocks img');
  
  if (tab === 'crypto') {
    crypto.style.display = 'grid';
    xstocks.style.display = 'none';
    tabCryptoImg.style.filter = 'brightness(1.2)';
    tabXstocksImg.style.filter = 'brightness(0.6)';
  } else {
    crypto.style.display = 'none';
    xstocks.style.display = 'grid';
    tabXstocksImg.style.filter = 'brightness(1.2)';
    tabCryptoImg.style.filter = 'brightness(0.6)';
  }
}

function exchangeSelectPair(from, to) {
  document.getElementById('fromCurrency').value = from;
  document.getElementById('toCurrency').value = to;
  exchangeCalcSwap();
}

async function exchangeLoadHistory() {
  try {
    const res = await authFetch(`${BASE_URL}/api/exchange/history`);
    const data = await res.json();
    if (data.success && data.swaps && data.swaps.length) {
      document.getElementById('historyList').innerHTML = data.swaps.map(s => `
        <div class="history-item">
          <div>
            <div style="color:#cceeff;font-weight:600;">${s.from_currency} → ${s.to_currency}</div>
            <div style="color:#fff;">${s.from_amount} → ${s.to_amount}</div>
            <div style="color:#ffaa00;font-size:0.72rem;margin-top:2px;">⛽ Gas: ${s.cogniq_fee || 5} COGNIQ</div>
          </div>
          <div class="status-${s.status}">${s.status === 'completed' ? EXCHANGE_LANG[currentLang].completed : EXCHANGE_LANG[currentLang].pending}</div>
        </div>`).join('');
    } else {
      document.getElementById('historyList').innerHTML = `<div class="loader">${EXCHANGE_LANG[currentLang].noHistory}</div>`;
    }
  } catch (e) {
    console.error('History error:', e);
  }
}

// ==================== РЕНДЕР БИРЖИ В SPA ====================
function loadExchangePanel() {
  const ex = EXCHANGE_LANG[currentLang] || EXCHANGE_LANG['en'];
  
  root.innerHTML = `
    <div class="exchange-card" style="max-width:480px;width:100%;margin:0 auto;padding:24px 16px;position:relative;z-index:3;">
      <button onclick="window.location.href='/fiat.html?lang=' + currentLang" id="fiatBtn" style="position:relative;background:none;border:none;padding:0;cursor:pointer;width:100%;margin:0 0 16px 0;">
        <img src="/exchange/fiat_btn.webp" style="width:100%;height:auto;display:block;">
        <span id="fiatBtnText" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:0.9rem;color:#ffcc44;white-space:nowrap;">${ex.fiatBtn}</span>
      </button>

      <div style="position:relative;margin-bottom:16px;">
        <img src="/public/images/cogniq/exchange_wallet_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
        <div style="position:relative;z-index:1;padding:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:0.75rem;color:#5577aa;" id="walletLabel">${ex.walletLabel}</div>
              <div style="font-size:0.9rem;font-weight:700;color:#fff;" id="walletAddr">${ex.notConnected}</div>
            </div>
            <button onclick="exchangeConnectWallet()" style="background:none;border:none;padding:8px 16px;font-size:0.8rem;font-weight:700;color:#00ffff;cursor:pointer;" id="connectWalletBtn">${ex.connectBtn}</button>
          </div>
        </div>
      </div>

      <div style="position:relative;margin-bottom:16px;">
        <img src="/public/images/cogniq/exchange_coming_soon_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
        <div style="position:relative;z-index:1;padding:16px;display:flex;align-items:center;justify-content:center;gap:12px;">
          <div>
            <div style="font-size:0.95rem;font-weight:700;color:#ffcc44;">COGNIQ / USDT</div>
            <div style="font-size:0.78rem;color:#aa9955;">Premium Trading Pair</div>
          </div>
          <button onclick="showListingInfo()" style="background:none;border:none;padding:0;cursor:pointer;">
            <img src="/public/images/cogniq/exchange_lock_btn.png" style="height:44px;width:auto;display:block;">
          </button>
        </div>
      </div>

      <div style="position:relative;margin-bottom:16px;">
        <img src="/public/images/cogniq/exchange_swap_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
        <div style="position:relative;z-index:1;padding:18px;">
          <div style="margin-bottom:12px;">
            <div style="font-size:0.75rem;color:#5577aa;margin-bottom:4px;" id="fromLabel">${ex.fromLabel}</div>
            <div style="display:flex;gap:8px;">
              <input type="number" id="fromAmount" placeholder="0.00" oninput="exchangeCalcSwap()" style="flex:1;padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:1rem;outline:none;">
              <select id="fromCurrency" onchange="exchangeCalcSwap()" style="padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.9rem;outline:none;">
                <option value="TON">TON</option>
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="XAUt0">XAUt0 (Gold)</option>
                <option value="AAPLx">AAPLx</option>
                <option value="NVDAx">NVDAx</option>
                <option value="TSLAx">TSLAx</option>
                <option value="AMZNx">AMZNx</option>
                <option value="SPYx">SPYx</option>
              </select>
            </div>
          </div>

          <div style="display:flex;justify-content:center;margin:8px 0;">
            <button onclick="exchangeSwapCurrencies()" style="background:none;border:none;padding:0;cursor:pointer;">
              <img src="/public/images/cogniq/exchange_swap_arrows.png" style="width:36px;height:36px;display:block;">
            </button>
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:0.75rem;color:#5577aa;margin-bottom:4px;" id="toLabel">${ex.toLabel}</div>
            <div style="display:flex;gap:8px;">
              <input type="number" id="toAmount" placeholder="0.00" readonly style="flex:1;padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:1rem;outline:none;">
              <select id="toCurrency" onchange="exchangeCalcSwap()" style="padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.9rem;outline:none;">
                <option value="USDT">USDT</option>
                <option value="TON">TON</option>
                <option value="BTC">BTC</option>
                <option value="XAUt0">XAUt0 (Gold)</option>
                <option value="AAPLx">AAPLx</option>
                <option value="NVDAx">NVDAx</option>
                <option value="TSLAx">TSLAx</option>
                <option value="AMZNx">AMZNx</option>
                <option value="SPYx">SPYx</option>
              </select>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:#5577aa;margin-bottom:12px;">
            <span><span id="rateLabel">${ex.rateLabel}</span> <span id="rateInfo">—</span></span>
            <span id="gasFeeLabel">${ex.gasFeeLabel}</span>
          </div>

          <button id="swapBtn" onclick="exchangeDoSwap()" disabled style="background:none;border:none;padding:0;cursor:pointer;width:100%;">
            <img src="/public/images/cogniq/exchange_swap_btn.png" style="width:100%;height:auto;display:block;">
          </button>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <button onclick="openExchangeInfoModal()" style="background:none;border:none;padding:0;cursor:pointer;display:block;margin-bottom:10px;width:100%;">
         <img id="exchangeInfoImg" src="/public/images/cogniq/exchange_info_${currentLang}.png" style="width:100%;height:auto;display:block;">
        </button>
        <div style="display:flex;gap:6px;margin-bottom:10px;">
          <button id="tabCrypto" onclick="exchangeSwitchPairTab('crypto')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
            <img src="/public/images/cogniq/exchange_tab_crypto.png" style="width:100%;height:auto;display:block;">
          </button>
          <button id="tabXstocks" onclick="exchangeSwitchPairTab('xstocks')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
            <img src="/public/images/cogniq/exchange_tab_xstocks.png" style="width:100%;height:auto;display:block;">
          </button>
        </div>
        <div id="pairsCrypto" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"></div>
        <div id="pairsXstocks" style="display:none;grid-template-columns:1fr 1fr;gap:10px;"></div>
      </div>

      <div>
        <div style="font-size:0.78rem;font-weight:700;color:#5577aa;margin-bottom:8px;" id="historyTitle">${ex.historyTitle}</div>
        <div id="historyList"><div class="loader">${ex.noHistory}</div></div>
      </div>
    </div>

    <div id="listingModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:1000;align-items:center;justify-content:center;backdrop-filter:blur(6px);" onclick="if(event.target===this)this.style.display='none'">
      <div style="background:rgba(10,18,38,0.98);border:1px solid rgba(255,200,50,0.3);border-radius:20px;padding:24px 20px;max-width:400px;width:90%;text-align:center;">
        <div style="font-size:1.2rem;font-weight:800;color:#ffcc44;margin-bottom:16px;">🔒 COGNIQ / USDT</div>
        <div id="listingInfoText" style="font-size:0.9rem;color:#aabbcc;line-height:1.6;margin-bottom:20px;"></div>
        <button onclick="document.getElementById('listingModal').style.display='none'" style="background:rgba(255,200,50,0.1);border:1px solid rgba(255,200,50,0.3);border-radius:28px;padding:10px 24px;font-size:0.9rem;font-weight:700;color:#ffcc44;cursor:pointer;">OK</button>
      </div>
    </div>
  `;

  // Проверяем сохранённый кошелёк
  const savedAddress = localStorage.getItem('walletAddress');
  if (savedAddress) {
    exchangeWalletAddress = savedAddress;
    document.getElementById('walletAddr').textContent = savedAddress.slice(0,6) + '...' + savedAddress.slice(-4);
  }
  if (tonConnectUI?.wallet) {
    exchangeWalletConnected = true;
    exchangeWalletAddress = tonConnectUI.wallet.account.address;
    document.getElementById('walletAddr').textContent = exchangeWalletAddress.slice(0,6) + '...' + exchangeWalletAddress.slice(-4);
    document.getElementById('swapBtn').disabled = false;
  }

  exchangeLoadRates();
  exchangeLoadHistory();
  setInterval(exchangeLoadRates, 60000);
}
