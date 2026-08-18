// ==================== FIAT (BestChange) ====================
const FIAT_LANG = {
  ru: {
    buy: 'КУПИТЬ', sell: 'ПРОДАТЬ', from: 'Отдаю', to: 'Получаю',
    exchangersTitle: 'Лучшие обменники', findMore: 'Найти другой способ обмена',
    modalTitleFrom: 'Выберите валюту (отдаю)', modalTitleTo: 'Выберите валюту (получаю)',
    search: 'Поиск...', close: 'Закрыть',
    reserve: 'Резерв', minMax: 'Мин/Макс', goTo: 'Перейти к обмену',
    bestRate: 'Лучший курс', reviews: 'отзывов', loading: 'Загрузка...',
    noExchangers: 'Нет доступных обменников для этой пары', error: 'Ошибка загрузки'
  },
  en: {
    buy: 'BUY', sell: 'SELL', from: 'You give', to: 'You get',
    exchangersTitle: 'Best exchangers', findMore: 'Find another exchange method',
    modalTitleFrom: 'Select currency (give)', modalTitleTo: 'Select currency (get)',
    search: 'Search...', close: 'Close',
    reserve: 'Reserve', minMax: 'Min/Max', goTo: 'Go to exchange',
    bestRate: 'Best rate', reviews: 'reviews', loading: 'Loading...',
    noExchangers: 'No exchangers for this pair', error: 'Load error'
  },
  fr: {
    buy: 'ACHETER', sell: 'VENDRE', from: 'Donner', to: 'Recevoir',
    exchangersTitle: 'Meilleurs échangeurs', findMore: 'Trouver une autre méthode',
    modalTitleFrom: 'Sélectionner (donner)', modalTitleTo: 'Sélectionner (recevoir)',
    search: 'Rechercher...', close: 'Fermer',
    reserve: 'Réserve', minMax: 'Min/Max', goTo: 'Aller à l\'échange',
    bestRate: 'Meilleur taux', reviews: 'avis', loading: 'Chargement...',
    noExchangers: 'Aucun échangeur pour cette paire', error: 'Erreur'
  },
  es: {
    buy: 'COMPRAR', sell: 'VENDER', from: 'Dar', to: 'Recibir',
    exchangersTitle: 'Mejores cambiadores', findMore: 'Encontrar otro método',
    modalTitleFrom: 'Seleccionar (dar)', modalTitleTo: 'Seleccionar (recibir)',
    search: 'Buscar...', close: 'Cerrar',
    reserve: 'Reserva', minMax: 'Min/Máx', goTo: 'Ir al intercambio',
    bestRate: 'Mejor tasa', reviews: 'reseñas', loading: 'Cargando...',
    noExchangers: 'Sin cambiadores para este par', error: 'Error'
  }
};

let fiatMode = 'buy';
let fiatFrom = null;
let fiatTo = null;
let fiatAllCurrencies = [];
let fiatChangersMap = {};
let fiatAllRates = [];
let fiatCurrentRates = [];
let fiatDisplayedCount = 10;
let fiatPartnerId = '1344120';

function isLikelyFiat(currency) {
  if (currency.crypto === true) return false;
  if (currency.crypto === false) return true;
  const name = (currency.viewname || currency.name || '').toLowerCase();
  const cryptoNames = ['bitcoin', 'ethereum', 'toncoin', 'tether', 'usdt', 'usdc', 'bnb', 'solana', 'ripple', 'cardano', 'dogecoin', 'polkadot', 'litecoin', 'btc', 'eth', 'sol', 'xrp', 'ada', 'doge', 'dot', 'ltc', 'ton'];
  for (const cn of cryptoNames) { if (name.includes(cn)) return false; }
  return true;
}

function loadFiatPanel() {
  const ft = FIAT_LANG[currentLang] || FIAT_LANG['ru'];

  // Очищаем биржу
  root.innerHTML = '';
  
  // Скрываем хедер и футер
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';
  
  const fiatContainer = document.createElement('div');
  fiatContainer.id = 'fiatContainer';
  fiatContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;overflow-y:auto;padding:20px 12px 40px;';
  fiatContainer.innerHTML = `
    <div class="fiat-card" style="max-width:480px;width:100%;margin:0 auto;padding:24px 16px;position:relative;z-index:3;">
      <button id="fiatBackBtn" style="background:none;border:none;padding:0;cursor:pointer;margin-bottom:16px;">
        <img src="/public/images/cogniq/exchange_back_${currentLang}.webp" style="height:44px;width:auto;display:block;">
      </button>

      <div style="text-align:center;margin-bottom:20px;">
        <img src="/public/images/cogniq/exchange_logo.webp" alt="NEURON" style="height:100px;width:auto;display:block;margin:0 auto;">
      </div>

      <div style="display:flex;gap:8px;background:transparent;padding:0;border:none;">
        <button class="fiat-mode-btn active" id="fiatBuyBtn" onclick="fiatSetMode('buy')" style="position:relative;flex:1;padding:0;border:none;background:none;cursor:pointer;">
          <img src="/exchange/fiat_tab.webp" style="width:100%;height:52px;display:block;object-fit:fill;border-radius:12px;">
          <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:0.9rem;color:#ffcc44;white-space:nowrap;">${ft.buy}</span>
        </button>
        <button class="fiat-mode-btn" id="fiatSellBtn" onclick="fiatSetMode('sell')" style="position:relative;flex:1;padding:0;border:none;background:none;cursor:pointer;">
          <img src="/exchange/fiat_tab.webp" style="width:100%;height:52px;display:block;object-fit:fill;border-radius:12px;filter:brightness(0.5);">
          <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-weight:700;font-size:0.9rem;color:#8899aa;white-space:nowrap;">${ft.sell}</span>
        </button>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:0.75rem;color:#5577aa;margin-bottom:6px;font-weight:600;" id="fiatFromLabel">${ft.from}</div>
        <div onclick="fiatOpenModal('from')" style="position:relative;background:none;border:none;padding:0;cursor:pointer;">
          <img src="/exchange/fiat_selector.webp" style="width:100%;height:52px;display:block;object-fit:fill;border-radius:12px;">
          <span id="fiatFromValue" style="position:absolute;top:50%;left:14px;transform:translateY(-50%);font-size:0.95rem;font-weight:600;color:#fff;">${ft.loading}</span>
          <span style="position:absolute;top:50%;right:14px;transform:translateY(-50%);color:#00ffaa;font-size:1.1rem;">▼</span>
        </div>
      </div>

      <div style="margin-bottom:16px;">
        <div style="font-size:0.75rem;color:#5577aa;margin-bottom:6px;font-weight:600;" id="fiatToLabel">${ft.to}</div>
        <div onclick="fiatOpenModal('to')" style="position:relative;background:none;border:none;padding:0;cursor:pointer;">
          <img src="/exchange/fiat_selector.webp" style="width:100%;height:52px;display:block;object-fit:fill;border-radius:12px;">
          <span id="fiatToValue" style="position:absolute;top:50%;left:14px;transform:translateY(-50%);font-size:0.95rem;font-weight:600;color:#fff;">${ft.loading}</span>
          <span style="position:absolute;top:50%;right:14px;transform:translateY(-50%);color:#00ffaa;font-size:1.1rem;">▼</span>
        </div>
      </div>

      <div style="position:relative;background:none;border:none;padding:0;margin-bottom:16px;">
        <img src="/exchange/fiat_calc.webp" style="width:100%;height:180px;display:block;object-fit:fill;border-radius:12px;">
        <input type="number" id="fiatCalcInput" placeholder="0.00" oninput="fiatCalculate()" inputmode="decimal" style="position:absolute;top:16px;left:16px;right:16px;width:auto;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;padding:14px;color:#fff;font-size:1.1rem;font-weight:700;outline:none;">
        <div style="position:absolute;bottom:16px;left:16px;right:16px;background:rgba(0,255,170,0.05);border-radius:10px;padding:12px;text-align:center;">
          <div id="fiatCalcResult" style="font-size:1.3rem;font-weight:800;color:#00ffaa;">≈ 0.00</div>
          <div id="fiatCalcRate" style="font-size:0.75rem;color:#5577aa;margin-top:4px;">—</div>
        </div>
      </div>

      <div style="font-size:0.85rem;font-weight:700;color:#ffaa00;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
        <span id="fiatExchangersTitle">${ft.exchangersTitle}</span>
        <span id="fiatExchangersCount" style="color:#5577aa;font-size:0.75rem;font-weight:400;"></span>
      </div>
      <div id="fiatExchangersList">
        <div style="text-align:center;padding:20px;color:#5577aa;font-size:0.85rem;">${ft.loading}</div>
      </div>
      <button id="fiatLoadMoreBtn" onclick="fiatLoadMoreExchangers()" style="display:none;width:100%;padding:14px;margin-top:10px;background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.3);border-radius:14px;color:#ffaa00;font-size:0.9rem;font-weight:700;cursor:pointer;"></button>

      <button id="fiatFindMoreBtn" onclick="fiatOpenBestChange()" style="width:100%;padding:14px;margin-top:16px;background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.3);border-radius:14px;color:#ffaa00;font-size:0.9rem;font-weight:700;cursor:pointer;">
        🔍 ${ft.findMore}
      </button>
    </div>

    <div id="fiatCurrencyModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:1000;align-items:center;justify-content:center;" onclick="if(event.target===this)fiatCloseModal()">
      <div style="background:rgba(10,18,38,0.98);border:1px solid rgba(255,170,0,0.3);border-radius:20px;padding:24px 20px;max-width:400px;width:90%;max-height:80vh;overflow-y:auto;">
        <div id="fiatModalTitle" style="font-size:1.1rem;font-weight:800;color:#ffaa00;margin-bottom:16px;text-align:center;"></div>
        <input type="text" id="fiatModalSearch" placeholder="${ft.search}" oninput="fiatFilterCurrencies()" style="width:100%;padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:10px;color:#fff;font-size:0.9rem;outline:none;margin-bottom:12px;">
        <div id="fiatModalList" style="display:flex;flex-direction:column;gap:8px;max-height:50vh;overflow-y:auto;"></div>
        <button onclick="fiatCloseModal()" style="width:100%;padding:12px;margin-top:16px;background:rgba(255,170,0,0.1);border:1px solid rgba(255,170,0,0.3);border-radius:12px;color:#ffaa00;font-size:0.9rem;font-weight:700;cursor:pointer;">${ft.close}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(fiatContainer);
  
  document.getElementById('fiatBackBtn').addEventListener('click', () => {
    fiatContainer.remove();
    switchTab('exchange');
  });
  
  fiatLoadPartnerId();
  Promise.all([fiatLoadCurrencies(), fiatLoadChangers()]);
}

function fiatSetMode(mode) {
  fiatMode = mode;
  document.getElementById('fiatBuyBtn').classList.toggle('active', mode === 'buy');
  document.getElementById('fiatSellBtn').classList.toggle('active', mode === 'sell');
  document.querySelector('#fiatBuyBtn img').style.filter = mode === 'buy' ? 'brightness(1)' : 'brightness(0.5)';
  document.querySelector('#fiatSellBtn img').style.filter = mode === 'sell' ? 'brightness(1)' : 'brightness(0.5)';
  
  const tmp = fiatFrom;
  fiatFrom = fiatTo;
  fiatTo = tmp;
  
  fiatUpdateSelectors();
  fiatLoadRates();
}

async function fiatLoadPartnerId() {
  try {
    const res = await fetch('/api/bestchange/partner-id');
    const data = await res.json();
    if (data.success && data.partnerId) fiatPartnerId = data.partnerId;
  } catch (e) {}
}

async function fiatLoadCurrencies() {
  try {
    const res = await fetch(`/api/bestchange/currencies/${currentLang}`);
    const data = await res.json();
    if (data.success && data.data?.currencies) {
      fiatAllCurrencies = data.data.currencies;
      const fiat = fiatAllCurrencies.filter(isLikelyFiat);
      const crypto = fiatAllCurrencies.filter(c => !isLikelyFiat(c));
      
      // Приоритет: Т-Банк (Тинькофф) RUB
const defaultFromFiat = fiat.find(c => 
  (c.viewname || '').toLowerCase().includes('т-банк') || 
  (c.viewname || '').toLowerCase().includes('t-bank') ||
  (c.viewname || '').toLowerCase().includes('тинькофф') ||
  (c.viewname || '').toLowerCase().includes('tinkoff')
) || fiat.find(c => 
  (c.viewname || '').toLowerCase().includes('сбер') || 
  (c.viewname || '').toLowerCase().includes('sber')
) || fiat.find(c => (c.viewname || '').includes('RUB')) || fiat[0];

// Приоритет: USDT BEP-20 → TRC-20 → ERC-20 → TON → Tether
const defaultToCrypto = crypto.find(c => 
  (c.viewname || '').toLowerCase().includes('usdt') && 
  (c.viewname || '').toLowerCase().includes('bep')
) || crypto.find(c => 
  (c.viewname || '').toLowerCase().includes('tether') && 
  (c.viewname || '').toLowerCase().includes('bep')
) || crypto.find(c => 
  (c.viewname || '').toLowerCase().includes('usdt') && 
  (c.viewname || '').toLowerCase().includes('trc')
) || crypto.find(c => 
  (c.viewname || '').toLowerCase().includes('usdt') && 
  (c.viewname || '').toLowerCase().includes('erc')
) || crypto.find(c => 
  (c.viewname || '').toLowerCase().includes('usdt') && 
  (c.viewname || '').toLowerCase().includes('ton')
) || crypto.find(c => 
  (c.viewname || '').toLowerCase().includes('tether')
) || crypto.find(c => 
  (c.viewname || '').toLowerCase().includes('usdt')
) || crypto[0];
      
      if (fiatMode === 'buy') {
        fiatFrom = defaultFromFiat;
        fiatTo = defaultToCrypto;
      } else {
        fiatFrom = defaultToCrypto;
        fiatTo = defaultFromFiat;
      }
      
      fiatUpdateSelectors();
      fiatLoadRates();
    }
  } catch (e) {
    console.error('Fiat currencies error:', e);
  }
}

async function fiatLoadChangers() {
  try {
    const res = await fetch(`/api/bestchange/changers/${currentLang}`);
    const data = await res.json();
    if (data.success && data.data?.changers) {
      fiatChangersMap = {};
      data.data.changers.forEach(c => fiatChangersMap[c.id] = c);
    }
  } catch (e) {}
}

async function fiatLoadRates() {
  if (!fiatFrom || !fiatTo) return;
  
  document.getElementById('fiatExchangersList').innerHTML = `<div style="text-align:center;padding:20px;color:#5577aa;">${FIAT_LANG[currentLang].loading}</div>`;
  
  try {
    const res = await fetch(`/api/bestchange/rates/${fiatFrom.id}/${fiatTo.id}`);
    const data = await res.json();
    if (data.success && data.data?.rates) {
      const pairKey = `${fiatFrom.id}-${fiatTo.id}`;
      const rates = data.data.rates[pairKey] || [];
      
      fiatAllRates = rates.filter(r => parseFloat(r.reserve) > 0).sort((a, b) => {
        const rateA = parseFloat(a.rate), rateB = parseFloat(b.rate);
        let goodnessA, goodnessB;
        if (fiatMode === 'buy') {
          goodnessA = rateA < 1 ? rateA : 1 / rateA;
          goodnessB = rateB < 1 ? rateB : 1 / rateB;
        } else {
          goodnessA = rateA < 1 ? 1 / rateA : rateA;
          goodnessB = rateB < 1 ? 1 / rateB : rateB;
        }
        return goodnessB - goodnessA;
      });
      
      fiatDisplayedCount = 10;
      fiatCurrentRates = fiatAllRates.slice(0, fiatDisplayedCount);
      fiatRenderExchangers();
      fiatCalculate();
    }
  } catch (e) {
    fiatAllRates = [];
    fiatCurrentRates = [];
    fiatRenderExchangers();
  }
}

function fiatUpdateSelectors() {
  if (fiatFrom) document.getElementById('fiatFromValue').textContent = fiatFrom.viewname || fiatFrom.name;
  if (fiatTo) document.getElementById('fiatToValue').textContent = fiatTo.viewname || fiatTo.name;
}

function fiatCalculate() {
  const amount = parseFloat(document.getElementById('fiatCalcInput').value) || 0;
  const resultEl = document.getElementById('fiatCalcResult');
  const rateEl = document.getElementById('fiatCalcRate');
  
  if (!fiatCurrentRates.length || amount <= 0) {
    resultEl.textContent = '≈ 0.00';
    rateEl.textContent = '—';
    return;
  }
  
  const bestRate = parseFloat(fiatCurrentRates[0].rate) || 0;
  const fromIsFiat = isLikelyFiat(fiatFrom);
  
  let result, displayRate;
  
  if (fromIsFiat && bestRate < 1) {
    result = amount * bestRate;
    displayRate = bestRate;
  } else if (fromIsFiat && bestRate >= 1) {
    result = amount / bestRate;
    displayRate = 1 / bestRate;
  } else if (!fromIsFiat && bestRate < 1) {
    displayRate = 1 / bestRate;
    result = amount * displayRate;
  } else {
    displayRate = bestRate;
    result = amount * bestRate;
  }
  
  resultEl.textContent = `≈ ${formatFiatNumber(result)} ${fiatTo?.viewname || ''}`;
  rateEl.textContent = `${FIAT_LANG[currentLang].bestRate}: 1 ${fiatFrom?.viewname || ''} = ${formatFiatNumber(displayRate)} ${fiatTo?.viewname || ''}`;
}

function formatFiatNumber(n) {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

function fiatRenderExchangers() {
  const list = document.getElementById('fiatExchangersList');
  const countEl = document.getElementById('fiatExchangersCount');
  const ft = FIAT_LANG[currentLang] || FIAT_LANG['ru'];
  
  if (!fiatCurrentRates.length) {
    list.innerHTML = `<div style="text-align:center;padding:20px;color:#5577aa;">${ft.noExchangers}</div>`;
    countEl.textContent = '';
    return;
  }
  
  countEl.textContent = `(${fiatCurrentRates.length})`;
  const fromIsFiat = isLikelyFiat(fiatFrom);
  
  list.innerHTML = fiatCurrentRates.map((r, idx) => {
    const changer = fiatChangersMap[r.changer] || { name: `Exchange #${r.changer}`, rating: 0, reviews: {} };
    const reviews = changer.reviews || {};
    const totalReviews = (reviews.positive || 0) + (reviews.neutral || 0) + (reviews.closed || 0);
    const rate = parseFloat(r.rate) || 0;
    const reserve = parseFloat(r.reserve);
    const inmin = parseFloat(r.inmin || 0);
    const inmax = parseFloat(r.inmax || 0);
    
    // Считаем отображаемый курс
    let displayRate, rateText;
    if (fromIsFiat) {
      if (rate < 1) {
        displayRate = rate;
        rateText = `1 ${fiatFrom?.viewname || ''} = ${formatFiatNumber(displayRate)} ${fiatTo?.viewname || ''}`;
      } else {
        displayRate = 1 / rate;
        rateText = `1 ${fiatTo?.viewname || ''} = ${formatFiatNumber(1/displayRate)} ${fiatFrom?.viewname || ''}`;
      }
    } else {
      if (rate < 1) {
        displayRate = 1 / rate;
        rateText = `1 ${fiatFrom?.viewname || ''} = ${formatFiatNumber(displayRate)} ${fiatTo?.viewname || ''}`;
      } else {
        displayRate = rate;
        rateText = `1 ${fiatFrom?.viewname || ''} = ${formatFiatNumber(displayRate)} ${fiatTo?.viewname || ''}`;
      }
    }
    
    return `
      <div style="background:rgba(10,20,38,0.8);border:1px solid ${idx === 0 ? 'rgba(0,255,170,0.4)' : 'rgba(255,170,0,0.15)'};border-radius:14px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
          <div style="font-size:0.95rem;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${idx === 0 ? '🥇 ' : ''}${changer.name}</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:0.8rem;color:#ffcc44;flex-shrink:0;">⭐ ${(changer.rating || 0).toFixed(1)} (${totalReviews})</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;font-size:0.78rem;">
          <div style="color:#ffaa00;">💰 <strong>${rateText}</strong></div>
          <div style="color:#aabbcc;">📦 ${ft.reserve}: <strong style="color:#fff;">${reserve.toLocaleString()} ${fiatTo?.viewname || ''}</strong></div>
          <div style="color:#aabbcc;">💵 ${ft.minMax}: <strong style="color:#fff;">${formatFiatNumber(inmin)} — ${formatFiatNumber(inmax)} ${fiatFrom?.viewname || ''}</strong></div>
        </div>
        <button onclick="fiatGoToExchanger(${r.changer})" style="width:100%;padding:10px;background:rgba(0,255,170,0.1);border:1px solid rgba(0,255,170,0.3);border-radius:10px;color:#00ffaa;font-size:0.85rem;font-weight:700;cursor:pointer;">🔗 ${ft.goTo}</button>
      </div>
    `;
  }).join('');
  fiatUpdateLoadMoreBtn();
}

function fiatGoToExchanger(changerId) {
  const changer = fiatChangersMap[changerId];
  const url = changer?.urls?.[currentLang] || changer?.urls?.en || `https://www.bestchange.com/click.php?id=${changerId}&p=${fiatPartnerId}`;
  window.open(url, '_blank');
}

function fiatOpenBestChange() {
  window.open(`https://www.bestchange.com/?p=${fiatPartnerId}`, '_blank');
}

let fiatModalType = 'from';

function fiatOpenModal(type) {
  fiatModalType = type;
  const ft = FIAT_LANG[currentLang] || FIAT_LANG['ru'];
  document.getElementById('fiatCurrencyModal').style.display = 'flex';
  document.getElementById('fiatModalTitle').textContent = type === 'from' ? ft.modalTitleFrom : ft.modalTitleTo;
  document.getElementById('fiatModalSearch').value = '';
  fiatRenderModalList();
}

function fiatCloseModal() {
  document.getElementById('fiatCurrencyModal').style.display = 'none';
}

function fiatRenderModalList(filter = '') {
  const f = filter.toLowerCase().trim();
  const isSelectingFiat = (fiatModalType === 'from' && fiatMode === 'buy') || (fiatModalType === 'to' && fiatMode === 'sell');
  
  let filtered = fiatAllCurrencies.filter(c => {
    if (f) {
      const match = (c.viewname || '').toLowerCase().includes(f) || (c.name || '').toLowerCase().includes(f);
      if (!match) return false;
    }
    return isSelectingFiat ? isLikelyFiat(c) : !isLikelyFiat(c);
  });
  
  document.getElementById('fiatModalList').innerHTML = filtered.map(c => `
    <div onclick="fiatSelectCurrency(${c.id})" style="padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;cursor:pointer;">
      <div style="font-size:0.9rem;font-weight:600;color:#fff;">${c.viewname || c.name}</div>
      <div style="font-size:0.75rem;color:#5577aa;margin-top:2px;">${c.name}</div>
    </div>
  `).join('') || `<div style="padding:12px;color:#5577aa;">${FIAT_LANG[currentLang].noExchangers}</div>`;
}

function fiatFilterCurrencies() {
  fiatRenderModalList(document.getElementById('fiatModalSearch').value);
}

function fiatSelectCurrency(id) {
  const currency = fiatAllCurrencies.find(c => c.id === id);
  if (!currency) return;
  
  if (fiatModalType === 'from') fiatFrom = currency;
  else fiatTo = currency;
  
  fiatUpdateSelectors();
  fiatLoadRates();
  fiatCloseModal();
}
function fiatLoadMoreExchangers() {
  fiatDisplayedCount += 10;
  fiatCurrentRates = fiatAllRates.slice(0, fiatDisplayedCount);
  fiatRenderExchangers();
}

function fiatUpdateLoadMoreBtn() {
  const btn = document.getElementById('fiatLoadMoreBtn');
  if (btn) {
    if (fiatDisplayedCount < fiatAllRates.length) {
      btn.style.display = 'block';
      btn.textContent = `🔽 Загрузить ещё (осталось ${fiatAllRates.length - fiatDisplayedCount})`;
    } else {
      btn.style.display = 'none';
    }
  }
}
