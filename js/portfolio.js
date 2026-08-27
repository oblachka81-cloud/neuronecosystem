// ==================== ПОРТФЕЛЬ ====================
async function loadPortfolioPanel() {
  root.innerHTML = `<div class="loader">📊 Загрузка портфеля...</div>`;
  
  try {
    const res = await authFetch(`${BASE_URL}/api/wallet/portfolio`);
    const data = await res.json();
    
    if (!data.success || !data.assets) {
      root.innerHTML = `<div class="loader">Ошибка загрузки</div>`;
      return;
    }

    const totalUsd = data.total_usd.toFixed(2);
    const hasAssets = data.assets.some(a => a.value > 0.01);

    let assetsHtml = '';
    if (hasAssets) {
      assetsHtml = data.assets.map(a => {
        if (a.value < 0.01 && a.symbol !== 'COGNIQ') return ''; // Скрываем пыль
        const amountStr = a.amount < 0.01 ? a.amount.toExponential(2) : a.amount.toLocaleString('en-US', { maximumFractionDigits: 4 });
        const valueStr = a.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        const priceStr = a.price > 0 ? `$${a.price.toLocaleString('en-US', { maximumFractionDigits: 6 })}` : '—';
        
        return `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:14px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-size:1.4rem;">${a.icon}</div>
            <div>
              <div style="font-weight:700;color:#f0f0ff;font-size:0.95rem;">${a.symbol}</div>
              <div style="font-size:0.78rem;color:#8899aa;">${amountStr} шт.</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:#00ffaa;font-size:0.95rem;">${valueStr}</div>
            <div style="font-size:0.78rem;color:#8899aa;">${priceStr}</div>
          </div>
        </div>`;
      }).join('');
    } else {
      assetsHtml = `
        <div style="text-align:center;padding:40px 20px;">
          <div style="font-size:3rem;margin-bottom:12px;">📊</div>
          <div style="font-size:1.1rem;font-weight:700;color:#f0f0ff;margin-bottom:8px;">Ваш портфель пока пуст</div>
          <div style="font-size:0.85rem;color:#8899aa;margin-bottom:20px;">Начните собирать капитал, играя в викторину или торгуя на бирже!</div>
          <button onclick="switchTab('game')" style="background:linear-gradient(135deg,#00ccff,#7a2eff);border:none;border-radius:40px;padding:12px 24px;font-size:0.9rem;font-weight:700;color:white;cursor:pointer;width:100%;margin-bottom:10px;">🧠 Играть в викторину</button>
          <button onclick="switchTab('exchange')" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:40px;padding:12px 24px;font-size:0.9rem;font-weight:700;color:#00ffaa;cursor:pointer;width:100%;">💱 Перейти на биржу</button>
        </div>`;
    }

    root.innerHTML = `
    <div class="portfolio-panel" style="padding:16px;">
      <button onclick="switchTab('wallet')" style="background:none;border:none;color:#8899aa;font-size:0.9rem;cursor:pointer;margin-bottom:16px;display:flex;align-items:center;gap:6px;">
        ← Назад к кошельку
      </button>
      
      <div style="background:linear-gradient(135deg, rgba(255,204,68,0.1), rgba(138,116,74,0.1));border:1px solid rgba(255,204,68,0.3);border-radius:20px;padding:24px 20px;text-align:center;margin-bottom:24px;box-shadow:0 0 24px rgba(255,204,68,0.15);">
        <div style="font-size:0.85rem;color:#e8d9a0;font-weight:600;margin-bottom:8px;letter-spacing:1px;">ОБЩАЯ ОЦЕНКА</div>
        <div style="font-size:2.4rem;font-weight:900;color:#ffcc44;text-shadow:0 0 20px rgba(255,204,68,0.4);">$${totalUsd}</div>
      </div>

      <div style="font-size:0.85rem;font-weight:700;color:#8899aa;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Активы</div>
      ${assetsHtml}
    </div>`;

  } catch (e) {
    console.error('[PORTFOLIO] Load error:', e);
    root.innerHTML = `<div class="loader">Ошибка сети</div>`;
  }
}
