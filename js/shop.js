// ==================== МАГАЗИН ====================
async function buyPack(currency) {
  if (currency === 'cogniq') {
    try {
      const r = await authFetch(`${BASE_URL}/api/shop/buy-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'cogniq' })
      });
      const data = await r.json();
      if (data.ok) {
        showToast(t.shopToastAdded, 3000);
        await loadWelcome();
      } else if (data.error === 'cooldown') {
        showToast(t.shopToastCooldown(data.hoursLeft), 3000);
      } else if (data.error === 'insufficient_cogniq') {
        showToast(t.shopToastNoFunds, 3000);
      }
    } catch(e) {
      showToast(t.errConnBtn, 3000);
    }
  } else if (currency === 'stars') {
    try {
      const res = await authFetch(`${BASE_URL}/api/create-stars-invoice-pack`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.ok && data.link) {
        Telegram.WebApp.openInvoice(data.link, (status) => {
          if (status === 'paid') {
            showToast(t.shopToastStarsPaid || '⚡ Оплата прошла! Пакет будет активирован.', 3000);
          }
        });
      } else {
        showToast(t.invoiceError || 'Ошибка создания инвойса', 2000);
      }
    } catch (e) {
      showToast(t.errConnBtn, 2000);
    }
  } else if (currency === 'usdt') {
    openTonModal('pack_20');
  }
}

async function buySubscription(type, currency) {
  if (currency === 'stars') {
    const endpoint = type === 'vip' ? '/api/create-stars-invoice-vip' : '/api/create-stars-invoice-premium';
    try {
      const res = await authFetch(`${BASE_URL}${endpoint}`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.ok && data.link) {
        Telegram.WebApp.openInvoice(data.link, (status) => {
          if (status === 'paid') {
            showToast(t.shopToastSubPaid, 3000);
          }
        });
      } else {
        showToast(t.invoiceError, 2000);
      }
    } catch (e) {
      showToast(t.errConnBtn, 2000);
    }
  } else if (currency === 'usdt') {
    openTonModal(type === 'vip' ? 'sub_vip' : 'sub_premium');
  }
}

async function buyFrame(itemKey, currency) {
  if (currency === 'usdt') {
    openTonModal('frame_' + itemKey);
    return;
  }
  try {
    const r = await authFetch(`${BASE_URL}/api/shop/buy-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frameKey: itemKey, currency: currency })
    });
    const data = await r.json();
    if (data.ok || data.success) {
      showToast(t.frameToastBought, 3000);
      loadShopPanel();
    } else if (data.error === 'insufficient_cogniq' || data.error === 'not_enough') {
      showToast(t.frameToastNoFunds, 3000);
    } else {
      showToast(`${t.frameToastErr}: ${data.error || ''}`, 3000);
    }
  } catch(e) {
    showToast(t.frameToastErr, 3000);
  }
}

async function equipFrame(itemKey) {
  try {
    const r = await authFetch(`${BASE_URL}/api/user/equip-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_key: itemKey })
    });
    const data = await r.json();
    if (data.ok || data.success) {
      showToast(t.frameToastEquipped, 3000);
      loadShopPanel();
    } else {
      showToast(t.frameToastErr, 3000);
    }
  } catch(e) {
    showToast(t.frameToastErr, 3000);
  }
}

async function unequipFrame() {
  try {
    const r = await authFetch(`${BASE_URL}/api/user/equip-frame`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_key: null })
    });
    const data = await r.json();
    if (data.ok || data.success) {
      showToast(t.frameToastUnequipped, 2000);
      loadShopPanel();
    }
  } catch(e) {
    showToast(t.frameToastErr, 3000);
  }
}

async function buyImpulseStars(pack) {
  try {
    const r = await authFetch(`${BASE_URL}/api/impulse/buy-stars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack, lang: currentLang })
    });
    const d = await r.json();
    if (d.ok && d.link) {
      Telegram.WebApp.openInvoice(d.link, (status) => {
        if (status === 'paid') showToast('⚡ IMPULSE зачислены!', 3000);
      });
    } else {
      showToast('Ошибка', 2000);
    }
  } catch(e) {
    showToast('Ошибка соединения', 2000);
  }
}

function buyImpulseUsdt(pack) {
  openTonModal('impulse_' + pack);
}

async function buyGameForImpulse() {
  try {
    const r = await authFetch(`${BASE_URL}/api/impulse/buy-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const d = await r.json();
    if (d.success) {
      showToast('🎮 Игра активирована!', 3000);
      const userRes = await authFetch(`${BASE_URL}/api/user`);
      const userData = await userRes.json();
      currentState.freeGamesLeft = userData.freeGamesLeft;
      updateGamesLeftUI(currentState.freeGamesLeft);
    } else {
      showToast(d.error || 'Недостаточно IMPULSE', 3000);
    }
  } catch(e) {
    showToast('Ошибка соединения', 2000);
  }
}

async function loadShopPanel() {
  root.innerHTML = `<div class="loader">${t.loading}</div>`;
  let inventory = [];
  let equippedFrame = null;
  try {
    const [invRes, profRes] = await Promise.all([
      authFetch(`${BASE_URL}/api/user/inventory`),
      authFetch(`${BASE_URL}/api/user/profile?lang=${currentLang}`)
    ]);
    const invData = await invRes.json();
    const profData = await profRes.json();
    inventory = invData.inventory || [];
    equippedFrame = profData.avatar_frame || null;
  } catch(e) {}

  const hasBasic = inventory.includes('frame_neon_basic');
  const hasPulse = inventory.includes('frame_neon_pulse');
  const isBasicActive = equippedFrame === 'frame_neon_basic';
  const isPulseActive = equippedFrame === 'frame_neon_pulse';

  root.innerHTML = `
      <div class="profile-panel" style="padding-bottom:40px;">
      <!-- Пакет игр -->
      <div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_pack_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:1.1rem;font-weight:700;color:#00ffff;">${t.shopPackTitle}</span>
      <span style="font-size:0.75rem;color:#5599bb;background:rgba(0,255,255,0.08);padding:3px 10px;border-radius:20px;">${t.shopPackBadge}</span>
    </div>
    <div style="font-size:0.85rem;color:#88aacc;margin-bottom:4px;">${t.shopPackDesc}</div>
    <div style="font-size:0.8rem;color:#5599bb;margin-bottom:16px;">${t.shopPackLimit}</div>
    <div style="display:flex;gap:8px;">
  <button onclick="buyPack('usdt')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="shop/shop_pack_btn_usdt.webp" style="width:100%;height:auto;display:block;">
  </button>
  <button onclick="buyPack('stars')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="shop/shop_pack_btn_stars.webp" style="width:100%;height:auto;display:block;">
  </button>
  <button onclick="buyPack('cogniq')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="shop/shop_pack_btn_cogniq.webp" style="width:100%;height:auto;display:block;">
  </button>
</div>
  </div>
</div>
      <!-- VIP -->
      <div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_vip_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:1.1rem;font-weight:700;color:#ffcc44;">${t.shopVipTitle}</span>
      <span style="font-size:0.75rem;color:#aa8833;background:rgba(255,170,0,0.1);padding:3px 10px;border-radius:20px;">${t.shopVipBadge}</span>
    </div>
    <div style="font-size:0.85rem;color:#ccaa55;margin-bottom:6px;">${t.shopVipDesc}</div>
    <div style="font-size:0.8rem;color:#aa8833;line-height:1.6;margin-bottom:16px;">${t.shopVipFeatures}</div>
    <div style="display:flex;gap:8px;">
  <button onclick="buySubscription('vip','usdt')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="shop/shop_vip_btn_usdt.webp" style="width:100%;height:auto;display:block;">
  </button>
  <button onclick="buySubscription('vip','stars')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="shop/shop_vip_btn_stars.webp" style="width:100%;height:auto;display:block;">
  </button>
</div>
  </div>
</div>
      <!-- PREMIUM -->
      <div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_premium_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="font-size:1.1rem;font-weight:700;color:#aa66ff;">${t.shopPremiumTitle}</span>
      <span style="font-size:0.75rem;color:#8855bb;background:rgba(170,102,255,0.1);padding:3px 10px;border-radius:20px;">${t.shopPremiumBadge}</span>
    </div>
    <div style="font-size:0.85rem;color:#bb88ff;margin-bottom:6px;">${t.shopPremiumDesc}</div>
    <div style="font-size:0.8rem;color:#8855bb;line-height:1.6;margin-bottom:16px;">${t.shopPremiumFeatures}</div>
    <div style="display:flex;gap:8px;">
  <button onclick="buySubscription('premium','usdt')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="shop/shop_premium_btn_usdt.webp" style="width:100%;height:auto;display:block;">
  </button>
  <button onclick="buySubscription('premium','stars')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
    <img src="shop/shop_premium_btn_stars.webp" style="width:100%;height:auto;display:block;">
  </button>
</div>
  </div>
</div>
<!-- ⚡ IMPULSE -->
<div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_impulse_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:20px;">
    <div style="font-size:1.1rem;font-weight:700;color:#ffaa00;margin-bottom:8px;">${t.impulseTitle || '⚡ IMPULSE'}</div>
    
    <div style="font-size:0.85rem;color:#ccaa55;margin-bottom:6px;">${t.impulseStarsLabel || '⭐ Купить за Stars'}</div>
    <div style="display:flex;gap:6px;margin-bottom:14px;">
      <button onclick="buyImpulseStars('small')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;"><img src="shop/shop_impulse_stars_small.webp" style="width:100%;height:auto;display:block;"></button>
      <button onclick="buyImpulseStars('medium')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;"><img src="shop/shop_impulse_stars_medium.webp" style="width:100%;height:auto;display:block;"></button>
      <button onclick="buyImpulseStars('big')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;"><img src="shop/shop_impulse_stars_big.webp" style="width:100%;height:auto;display:block;"></button>
    </div>
    
    <div style="font-size:0.85rem;color:#ccaa55;margin-bottom:6px;">${t.impulseUsdtLabel || '💎 Купить за USDT'}</div>
    <div style="display:flex;gap:6px;margin-bottom:14px;">
      <button onclick="buyImpulseUsdt('small')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;"><img src="shop/shop_impulse_usdt_small.webp" style="width:100%;height:auto;display:block;"></button>
      <button onclick="buyImpulseUsdt('big')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;"><img src="shop/shop_impulse_usdt_big.webp" style="width:100%;height:auto;display:block;"></button>
    </div>
    
    <div style="font-size:0.85rem;color:#ccaa55;margin-bottom:6px;">${t.impulseExchangeLabel || '🎮 Обменять на игру'}</div>
    <button onclick="buyGameForImpulse()" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img id="impulseGameBtnImg" src="shop/shop_impulse_game_btn_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
  </div>
</div>
      <!-- РАМКИ АВАТАРА -->
      <div style="margin-top:8px;margin-bottom:6px;">
        <div style="font-size:0.8rem;font-weight:700;color:#5599bb;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">${t.shopFramesTitle}</div>
        <div style="font-size:0.78rem;color:#445566;margin-bottom:14px;">${t.shopFramesSubtitle}</div>
      </div>
      <!-- Неон базовый -->
      <div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_frame_card.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:14px;display:flex;align-items:center;gap:14px;">
    <div class="frame-preview" style="position:relative;width:60px;height:60px;">
  <div style="font-size:1.7rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">🧠</div>
  <img src="shop/shop_neon_basic_frame.webp" style="position:absolute;top:-6px;left:-6px;width:72px;height:72px;pointer-events:none;">
</div>
    <div class="frame-info">
      <div class="frame-name">${t.frameNeonBasicName}${isBasicActive ? `<span class="frame-badge-active">${t.frameBtnActive}</span>` : ''}</div>
      <div class="frame-price">${t.frameNeonBasicPrice}</div>
      <div class="frame-btns">
  ${isBasicActive 
    ? `<button class="frame-btn frame-btn-active" disabled>${t.frameBtnActive}</button>
       <button class="frame-btn frame-btn-equip" onclick="unequipFrame()">${t.frameBtnUnequip}</button>`
    : hasBasic 
      ? `<button class="frame-btn frame-btn-equip" onclick="equipFrame('frame_neon_basic')">${t.frameBtnEquip}</button>`
      : `<button onclick="buyFrame('frame_neon_basic','cogniq')" style="background:none;border:none;padding:0;cursor:pointer;">
           <img src="shop/shop_frame_btn_300cogniq.webp" style="height:44px;width:auto;display:block;">
         </button>`
  }
</div>
    </div>
  </div>
</div>
      <!-- Неон пульс -->
      <div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_frame_card.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:14px;display:flex;align-items:center;gap:14px;">
    <div class="frame-preview" style="position:relative;width:60px;height:60px;">
  <div style="font-size:1.7rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">🧠</div>
  <img src="shop/shop_neon_pulse_frame.webp" style="position:absolute;top:-6px;left:-6px;width:72px;height:72px;pointer-events:none;">
</div>
    <div class="frame-info">
      <div class="frame-name">${t.frameNeonPulseName}${isPulseActive ? `<span class="frame-badge-active">${t.frameBtnActive}</span>` : ''}</div>
      <div class="frame-price">${t.frameNeonPulsePrice}</div>
      <div class="frame-btns">
  ${isPulseActive 
    ? `<button class="frame-btn frame-btn-active" disabled>${t.frameBtnActive}</button>
       <button class="frame-btn frame-btn-equip" onclick="unequipFrame()">${t.frameBtnUnequip}</button>`
    : hasPulse 
      ? `<button class="frame-btn frame-btn-equip" onclick="equipFrame('frame_neon_pulse')">${t.frameBtnEquip}</button>`
      : `<div style="display:flex;gap:6px;">
           <button onclick="buyFrame('frame_neon_pulse','cogniq')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
             <img src="shop/shop_frame_btn_500cogniq.webp" style="width:100%;height:auto;display:block;">
           </button>
           <button onclick="buyFrame('frame_neon_pulse','usdt')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;">
             <img src="shop/shop_frame_btn_1usdt.webp" style="width:100%;height:auto;display:block;">
           </button>
         </div>`
  }
</div>
    </div>
  </div>
</div>
    <!-- Cartier Gold -->
<div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_frame_card.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:14px;display:flex;align-items:center;gap:14px;">
    <div class="frame-preview" style="position:relative;width:60px;height:60px;">
      <div style="font-size:1.7rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">👑</div>
      <img src="shop/shop_neon_gold_frame.webp" style="position:absolute;top:-6px;left:-6px;width:72px;height:72px;pointer-events:none;">
    </div>
    <div class="frame-info">
      <div class="frame-name">${t.frameNeonGoldName || 'Cartier Gold'}</div>
      <div class="frame-price">${t.frameNeonGoldPrice || '🏆 Топ-1 недели'}</div>
      <div class="frame-btns" style="color:#ffcc44;font-size:0.78rem;">${t.frameNeonGoldBadge || '🥇 Выдаётся лидеру недели'}</div>
    </div>
  </div>
</div>
    <!-- VIP Frame -->
<div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_frame_card.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:14px;display:flex;align-items:center;gap:14px;">
    <div class="frame-preview" style="position:relative;width:60px;height:60px;">
      <div style="font-size:1.7rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">👑</div>
      <img src="shop/shop_vip_frame_avatar.webp" style="position:absolute;top:-6px;left:-6px;width:72px;height:72px;pointer-events:none;">
    </div>
    <div class="frame-info">
      <div class="frame-name">${t.frameVipName || '👑 VIP Frame'}</div>
      <div class="frame-price">${t.frameVipPrice || 'Выдаётся с VIP подпиской'}</div>
      <div class="frame-btns" style="color:#ffcc44;font-size:0.78rem;">${t.frameVipBadge || 'Автоматически при активации VIP'}</div>
    </div>
  </div>
</div>

<!-- Premium Frame -->
<div style="position:relative; margin-bottom:14px;">
  <img src="shop/shop_frame_card.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:14px;display:flex;align-items:center;gap:14px;">
    <div class="frame-preview" style="position:relative;width:60px;height:60px;">
      <div style="font-size:1.7rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%;">💎</div>
      <img src="shop/shop_premium_frame_avatar.webp" style="position:absolute;top:-6px;left:-6px;width:72px;height:72px;pointer-events:none;">
    </div>
    <div class="frame-info">
      <div class="frame-name">${t.framePremiumName || '💎 Premium Frame'}</div>
      <div class="frame-price">${t.framePremiumPrice || 'Выдаётся с PREMIUM подпиской'}</div>
      <div class="frame-btns" style="color:#aa66ff;font-size:0.78rem;">${t.framePremiumBadge || 'Автоматически при активации PREMIUM'}</div>
    </div>
  </div>
</div>`;
}
