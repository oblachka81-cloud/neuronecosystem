// ==================== ПОРТФЕЛЬ ====================
async function loadPortfolioPanel() {
  root.innerHTML = `<div class="loader"> ...</div>`;

  try {
    let walletAddress = '';
    if (tonConnectUI && tonConnectUI.wallet) {
      walletAddress = tonConnectUI.wallet.account.address;
    }

    const url = `${BASE_URL}/api/wallet/portfolio${walletAddress ? '?wallet_address=' + encodeURIComponent(walletAddress) : ''}`;
    const res = await authFetch(url);
    const data = await res.json();

    if (!data.success || !data.assets) {
      root.innerHTML = `<div class="loader">Ошибка загрузки</div>`;
      return;
    }

    const t = data.texts || { title: 'TOTAL VALUE', assets: 'ASSETS', back: '← Back', empty: 'Empty', emptyDesc: '', playBtn: ' Play', exchangeBtn: '💱 Exchange', units: 'units' };
    const totalUsd = data.total_usd.toFixed(2);
    const hasAssets = data.assets.some(a => a.value > 0.01);

    let assetsHtml = '';
    if (hasAssets) {
      assetsHtml = data.assets.map(a => {
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
      <div style="background:linear-gradient(135deg, rgba(0,204,255,0.1), rgba(122,46,255,0.1));border:1px solid rgba(0,204,255,0.3);border-radius:20px;padding:20px;margin-bottom:20px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;background:radial-gradient(circle, rgba(0,204,255,0.2) 0%, transparent 70%);border-radius:50%;"></div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="font-size:2rem;">🚀</div>
          <div>
            <div style="font-size:0.75rem;color:#00ccff;font-weight:700;letter-spacing:1px;text-transform:uppercase;">COGNIQ LISTING</div>
            <div style="font-size:1.1rem;font-weight:800;color:#f0f0ff;">${t.listingTitle}</div>
          </div>
        </div>
        <div style="font-size:0.85rem;color:#8899aa;margin-bottom:14px;line-height:1.5;">${t.listingDesc}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <div style="flex:1;min-width:120px;background:rgba(0,0,0,0.3);border-radius:12px;padding:10px;text-align:center;">
            <div style="font-size:0.7rem;color:#8899aa;margin-bottom:4px;">Q3-Q4 2027</div>
            <div style="font-size:0.85rem;font-weight:700;color:#00ffaa;">DEX Listing</div>
          </div>
          <div style="flex:1;min-width:120px;background:rgba(0,0,0,0.3);border-radius:12px;padding:10px;text-align:center;">
            <div style="font-size:0.7rem;color:#8899aa;margin-bottom:4px;">CEX</div>
            <div style="font-size:0.85rem;font-weight:700;color:#ffcc44;">2028</div>
          </div>
          <div style="flex:1;min-width:120px;background:rgba(0,0,0,0.3);border-radius:12px;padding:10px;text-align:center;">
            <div style="font-size:0.7rem;color:#8899aa;margin-bottom:4px;">${t.yourBalance}</div>
            <div style="font-size:0.85rem;font-weight:700;color:#00ccff;">${cogniqBalance.toLocaleString()} 🧠</div>
          </div>
        </div>
      </div>`;

    root.innerHTML = `
    <div class="portfolio-panel" style="padding:16px;">
      <button onclick="switchTab('wallet')" style="background:none;border:none;color:#8899aa;font-size:0.9rem;cursor:pointer;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
        ${t.back}
      </button>

      <div style="background:linear-gradient(135deg, rgba(255,204,68,0.1), rgba(138,116,74,0.1));border:1px solid rgba(255,204,68,0.3);border-radius:20px;padding:24px 20px;text-align:center;margin-bottom:20px;box-shadow:0 0 24px rgba(255,204,68,0.15);">
        <div style="font-size:0.85rem;color:#e8d9a0;font-weight:600;margin-bottom:8px;letter-spacing:1px;">${t.title}</div>
        <div style="font-size:2.4rem;font-weight:900;color:#ffcc44;text-shadow:0 0 20px rgba(255,204,68,0.4);">$${totalUsd}</div>
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
