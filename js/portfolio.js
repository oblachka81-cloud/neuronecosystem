// ==================== ПОРТФЕЛЬ ====================
async function loadPortfolioPanel() {
  root.innerHTML = `<div class="loader">📊 Загрузка портфеля...</div>`;

  try {
    let walletAddress = '';
    if (tonConnectUI && tonConnectUI.wallet) {
      walletAddress = tonConnectUI.wallet.account.address;
    }

    const url = `${BASE_URL}/api/wallet/portfolio?lang=${currentLang}${walletAddress ? '&wallet_address=' + encodeURIComponent(walletAddress) : ''}`;
    const res = await authFetch(url);
    const data = await res.json();

    if (!data.success || !data.assets) {
      root.innerHTML = `<div class="loader">Ошибка загрузки</div>`;
      return;
    }

    const t = data.texts || {};
    
    const totalUsd = data.total_usd.toFixed(2);
    const hasAssets = data.assets.some(a => a.value > 0.01);
    
    // 👇 ИСПРАВЛЕНИЕ: получаем баланс COGNIQ из ответа сервера
    const cogniqAsset = data.assets.find(a => a.symbol === 'COGNIQ');
    const cogniqBalance = cogniqAsset ? cogniqAsset.amount : 0;

    // СОРТИРОВКА: COGNIQ первый, остальные по убыванию value
const sortedAssets = [...data.assets].sort((a, b) => {
  if (a.symbol === 'COGNIQ') return -1;
  if (b.symbol === 'COGNIQ') return 1;
  return b.value - a.value;
});

  let assetsHtml = '';
  if (hasAssets) {
  assetsHtml = sortedAssets.map(a => {
        if (a.value < 0.01 && a.symbol !== 'COGNIQ') return '';
        const amountStr = a.amount < 0.01 ? a.amount.toExponential(2) : a.amount.toLocaleString('en-US', { maximumFractionDigits: 4 });
        const valueStr = a.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const priceStr = a.price > 0 ? `$${a.price.toLocaleString('en-US', { maximumFractionDigits: 6 })}` : '—';

        return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:14px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:1.4rem;">${a.icon}</div>
            <div>
              <div style="font-weight:700;color:#f0f0ff;font-size:0.95rem;">${a.symbol}</div>
              <div style="font-size:0.78rem;color:#8899aa;">${amountStr} ${t.units}</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:#00ffaa;font-size:0.95rem;">${valueStr}</div>
            <div style="font-size:0.78rem;color:#8899aa;">${priceStr}</div>
          </div>
        </div>`;
      }).join('');
    }

    // Empty state
    const emptyHtml = !hasAssets ? `
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:3rem;margin-bottom:12px;">📊</div>
        <div style="font-size:1.1rem;font-weight:700;color:#f0f0ff;margin-bottom:8px;">${t.empty}</div>
        <div style="font-size:0.85rem;color:#8899aa;margin-bottom:20px;">${t.emptyDesc}</div>
      </div>` : '';

    // Кнопки CTA — всегда внизу
    const ctaHtml = `
      <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px;">
        <button onclick="switchTab('game')" style="background:linear-gradient(135deg,#00ccff,#7a2eff);border:none;border-radius:40px;padding:14px 24px;font-size:0.95rem;font-weight:700;color:white;cursor:pointer;width:100%;box-shadow:0 4px 16px rgba(0,204,255,0.3);">
          ${t.playBtn}
        </button>
        <button onclick="switchTab('exchange')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:40px;padding:14px 24px;font-size:0.95rem;font-weight:700;color:#00ffaa;cursor:pointer;width:100%;">
          ${t.exchangeBtn}
        </button>
      </div>`;

    // Карточка листинга COGNIQ
    const listingCardHtml = `
  <div style="margin-bottom:18px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(0,204,255,0.15);padding:20px;">
    <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#00ccff,#7a2eff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;text-align:center;">${t.listingTitle}</div>
    <div style="font-size:0.85rem;background:linear-gradient(90deg,#c8d0e0 0%,#ffffff 50%,#c8d0e0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:16px;line-height:1.5;text-align:center;">${t.listingDesc}</div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;background:rgba(0,0,0,0.25);border-radius:12px;padding:12px;text-align:center;">
        <div style="font-size:0.65rem;background:linear-gradient(90deg,#8899aa 0%,#aabbcc 50%,#8899aa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;letter-spacing:1px;">Q1-Q2 2027</div>
        <div style="font-size:0.8rem;font-weight:700;background:linear-gradient(90deg,#00ffaa 0%,#66ffcc 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${t.dexListing}</div>
      </div>
      <div style="flex:1;background:rgba(0,0,0,0.25);border-radius:12px;padding:12px;text-align:center;">
        <div style="font-size:0.65rem;background:linear-gradient(90deg,#8899aa 0%,#aabbcc 50%,#8899aa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;letter-spacing:1px;">Q3-Q4 2027</div>
        <div style="font-size:0.8rem;font-weight:700;background:linear-gradient(90deg,#ffcc44 0%,#ffdd88 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${t.cexListing}</div>
      </div>
      <div style="flex:1;background:rgba(0,0,0,0.25);border-radius:12px;padding:12px;text-align:center;">
        <div style="font-size:0.65rem;background:linear-gradient(90deg,#8899aa 0%,#aabbcc 50%,#8899aa 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px;letter-spacing:1px;">${t.yourBalance}</div>
        <div style="font-size:0.8rem;font-weight:700;background:linear-gradient(90deg,#00ccff 0%,#66ddff 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${cogniqBalance.toLocaleString()}</div>
      </div>
    </div>
  </div>`;

    root.innerHTML = `
    <div class="portfolio-panel" style="padding:16px;">
      <button onclick="switchTab('wallet')" style="background:none;border:none;color:#8899aa;font-size:0.9rem;cursor:pointer;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
        ${t.back}
      </button>

      <div style="margin-bottom:18px;border:2px solid #e9eef7;border-radius:16px;box-shadow:0 0 16px rgba(255,204,68,0.15);padding:20px;text-align:center;">
      <div style="font-size:0.72rem;font-weight:700;background:linear-gradient(90deg,#ffcc44,#e8d9a0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">${t.title}</div>
      <div style="font-size:2.4rem;font-weight:900;background:linear-gradient(90deg,#ffcc44 0%,#fff3c4 50%,#ffcc44 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(255,204,68,0.4));">$${totalUsd}</div>
  </div>

      ${listingCardHtml}

      ${hasAssets ? `<div style="font-size:0.85rem;font-weight:700;color:#8899aa;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">${t.assets}</div>` : ''}
      ${emptyHtml}
      ${assetsHtml}
      ${ctaHtml}
    </div>`;

  } catch (e) {
    console.error('[PORTFOLIO] Load error:', e);
    root.innerHTML = `<div class="loader">Ошибка сети</div>`;
  }
}
