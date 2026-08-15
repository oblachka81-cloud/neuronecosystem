// ==================== ПРОФИЛЬ ====================
async function loadProfilePanel() {
  root.innerHTML = `<div class="loader">${t.loading}</div>`;
  try {
    const res = await authFetch(`${BASE_URL}/api/user/profile?lang=${currentLang}`);
    const data = await res.json();
    if (data.error) {
      root.innerHTML = `<div class="loader">${t.errAuth}</div>`;
      return;
    }
    renderProfilePanel(data);
  } catch(e) {
    root.innerHTML = `<div class="loader">${t.errConn}</div>`;
  }
}

function getFrameClass(frame) {
  if (frame === 'frame_neon_basic') return 'avatar-frame-neon-basic';
  if (frame === 'frame_neon_pulse') return 'avatar-frame-neon-pulse';
  if (frame === 'frame_neon_gold') return 'avatar-frame-neon-gold';
  return '';
}

function renderProfilePanel(data) {
  let isAnon = data.privacyMode === 'anonymous';

  const frameClass = getFrameClass(data.avatar_frame);
  const subBorder = data.subscriptionType === 'premium' ? 'border:2.5px solid #aa66ff;box-shadow:0 0 14px rgba(170,102,255,0.6);' : data.subscriptionType === 'vip' ? 'border:2.5px solid #ffcc44;box-shadow:0 0 14px rgba(255,204,68,0.6);' : '';
  const avatarBorder = frameClass ? '' : subBorder;
  let avatarHtml;
  const frameUrl = '/public/images/cogniq/profile_avatar_frame.png';

  if (data.photo_url) {
    const fullPhotoUrl = BASE_URL + data.photo_url;
    avatarHtml = `
      <div style="position:relative;width:120px;height:120px;margin:0 auto;">
        <img class="profile-avatar-img ${frameClass}" id="profileAvatarImg" src="${fullPhotoUrl}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;${avatarBorder}"
          onerror="document.getElementById('profileAvatarImg').style.display='none';document.getElementById('profileAvatarFallback').style.display='flex';">
        <div class="profile-avatar-fallback ${frameClass}" id="profileAvatarFallback" style="display:none;width:120px;height:120px;border-radius:50%;position:absolute;top:0;left:0;z-index:1;align-items:center;justify-content:center;font-size:2.8rem;font-weight:900;color:#00ffff;${avatarBorder}">${escapeHtml((data.nickname||userName||'P')[0].toUpperCase())}</div>
        <img src="${frameUrl}" style="position:absolute;top:0;left:0;width:120px;height:120px;z-index:2;pointer-events:none;">
      </div>`;
  } else {
    const initial = (data.nickname || userName || 'P')[0].toUpperCase();
    avatarHtml = `
      <div style="position:relative;width:120px;height:120px;margin:0 auto;">
        <div class="profile-avatar-fallback ${frameClass}" style="width:120px;height:120px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.8rem;font-weight:900;color:#00ffff;position:absolute;top:0;left:0;z-index:1;${avatarBorder}">${escapeHtml(initial)}</div>
        <img src="${frameUrl}" style="position:absolute;top:0;left:0;width:120px;height:120px;z-index:2;pointer-events:none;">
      </div>`;
  }

  root.innerHTML = `
    <div class="profile-panel">
      <div class="profile-avatar-wrap">
        ${avatarHtml}
      </div>

<div style="position:relative; margin-bottom:6px;">
  <img src="/public/images/cogniq/profile_nickname_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;opacity:0.65;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:14px 18px;">
    <div class="profile-nickname-row" id="nicknameDisplay">
      <span class="profile-nickname-val" id="nicknameVal" style="${data.subscriptionType === 'premium' ? 'color:#aa66ff;' : data.subscriptionType === 'vip' ? 'color:#ffcc44;' : ''}">${data.subscriptionType === 'premium' ? '💎 ' : data.subscriptionType === 'vip' ? '👑 ' : ''}${escapeHtml(data.nickname || userName || 'Игрок')}</span>
      <button class="profile-edit-btn" id="nicknameEditBtn">${t.profileNicknameBtn}</button>
    </div>
    <div id="nicknameEditArea" style="display:none;">
      <input class="profile-input" id="nicknameInput" maxlength="24" placeholder="${t.profileNicknamePlaceholder}" value="${escapeHtml(data.nickname || '')}">
      <div class="profile-input-btns">
        <button class="profile-input-cancel" id="nicknameCancelBtn">${t.profileNicknameCancel}</button>
        <button class="profile-input-save" id="nicknameSaveInlineBtn">${t.profileNicknameSave}</button>
      </div>
    </div>
  </div>
</div>

<div style="position:relative; margin-bottom:6px;">
  <img src="/public/images/cogniq/profile_achievements_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;opacity:0.65;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:16px 18px;">
    <div class="emoji-grid" id="achievementsGrid" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;padding:8px 0;">
      <div style="color:#5599bb;font-size:0.85rem;width:100%;text-align:center;padding:12px 0;">⏳ ${t.loading || 'Загрузка...'}</div>
    </div>
  </div>
</div>

<div style="position:relative; margin-bottom:6px;">
  <img src="/public/images/cogniq/profile_privacy_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;opacity:0.65;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:10px 18px;">
    <div class="profile-toggle-row">
      <span class="profile-toggle-label" id="anonLabel">${isAnon ? t.profileAnonHide : t.profileAnonNick}</span>
      <label class="profile-toggle">
        <input type="checkbox" id="anonToggle" ${isAnon ? 'checked' : ''}>
        <span class="profile-toggle-slider"></span>
      </label>
    </div>
  </div>
</div>

<div style="position:relative; margin-bottom:6px;">
  <img src="/public/images/cogniq/profile_stats_frame.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;opacity:0.65;" alt="">
  <div style="position:relative;z-index:1;background:none;border:none;padding:14px 18px;">
    <div class="wallet-info-row">
      <span class="wallet-info-label">${t.tokensLabel}</span>
      <span class="wallet-info-value green">${data.totalScore.toLocaleString()}</span>
    </div>
    <div class="wallet-info-row">
      <span class="wallet-info-label">${t.walletGamesPlayed}</span>
      <span class="wallet-info-value">${data.gamesPlayed || 0}</span>
    </div>
    <div class="wallet-info-row">
      <span class="wallet-info-label">${t.walletRank}</span>
      <span class="wallet-info-value green">${currentState.myRank}</span>
    </div>
    <div class="wallet-info-row">
      <span class="wallet-info-label">🔥 Streak</span>
      <span class="wallet-info-value">${data.streakCount || 0} ${t.streakDays}</span>
    </div>
    <div class="wallet-info-row">
      <span class="wallet-info-label">⚡ ${t.profileRank}</span>
      <span class="wallet-info-value" style="color:#ffcc44;">${data.rankEmoji || ''} ${data.rankTitle || '—'}</span>
    </div>
    <div class="wallet-info-row">
      <span class="wallet-info-label">${t.walletTicketsLabel}</span>
      <span class="wallet-info-value green">${data.withdrawTickets || 0}</span>
    </div>
    <div class="wallet-info-row">
      <span class="wallet-info-label">📅 ${t.profileRegistered}</span>
      <span class="wallet-info-value">${data.registeredAt ? new Date(data.registeredAt).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : currentLang === 'fr' ? 'fr-FR' : currentLang === 'es' ? 'es-ES' : 'en-GB', {day:'numeric', month:'long', year:'numeric'}) : '—'}</span>
    </div>
    ${data.subscriptionType ? `
    <div class="wallet-info-row">
      <span class="wallet-info-label">${t.profileSubscription || '🎫 Подписка'}</span>
      <span class="wallet-info-value" style="color:${data.subscriptionType === 'premium' ? '#aa66ff' : '#ffcc44'};">
        ${data.subscriptionType === 'premium' ? '💎 PREMIUM' : '👑 VIP'}
        ${data.subscriptionExpiresAt ? `<span style="font-size:0.75rem;color:#667799;margin-left:6px;">${t.profileUntil || 'до '}${new Date(data.subscriptionExpiresAt).toLocaleDateString()}</span>` : ''}
      </span>
    </div>
    ` : ''}
  </div>
</div>
      <button id="profileSaveBtn" style="position:relative;background:none;border:none;padding:0;cursor:pointer;width:100%;margin-top:18px;">
  <img id="profileSaveBtnImg" src="/public/images/cogniq/profile_save_btn_${currentLang}.png" style="width:100%;height:auto;display:block;opacity:0.65;">
</button>
    </div>`;

  document.getElementById('nicknameEditBtn').addEventListener('click', () => {
    document.getElementById('nicknameDisplay').style.display = 'none';
    document.getElementById('nicknameEditArea').style.display = 'block';
    document.getElementById('nicknameInput').focus();
  });

  document.getElementById('nicknameCancelBtn').addEventListener('click', () => {
    document.getElementById('nicknameDisplay').style.display = 'flex';
    document.getElementById('nicknameEditArea').style.display = 'none';
  });

  document.getElementById('nicknameSaveInlineBtn').addEventListener('click', async () => {
    const val = document.getElementById('nicknameInput').value.trim();
    if (val.length < 2) { showToast(t.nicknameMinLength || 'Минимум 2 символа', 2000); return; }
    try {
      const res = await authFetch(`${BASE_URL}/api/user/nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: val, privacy_mode: isAnon ? 'anonymous' : 'nickname' })
      });
      const result = await res.json();
      if (!result.success) { showToast(result.message || t.nicknameSaveError || 'Ошибка сохранения', 2000); return; }
    } catch (e) { showToast(t.nicknameSaveError || 'Ошибка сохранения', 2000); return; }
    document.getElementById('nicknameVal').textContent = val;
    document.getElementById('nicknameDisplay').style.display = 'flex';
    document.getElementById('nicknameEditArea').style.display = 'none';
    showToast(t.nicknameSaved || 'Никнейм сохранён', 2000);
  });

  document.getElementById('anonToggle').addEventListener('change', (e) => {
    isAnon = e.target.checked;
    document.getElementById('anonLabel').textContent = isAnon ? t.profileAnonHide : t.profileAnonNick;
  });

  loadAchievements();

  document.getElementById('profileSaveBtn').addEventListener('click', async () => {
    const nickname = document.getElementById('nicknameVal').textContent.trim();
    const btn = document.getElementById('profileSaveBtn');
    btn.disabled = true;
    btn.textContent = '⏳ ...';
    try {
      const res = await authFetch(`${BASE_URL}/api/user/nickname`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname,
          privacy_mode: isAnon ? 'anonymous' : 'nickname'
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast(t.profileSaved, 3000);
      } else {
        showToast(`${t.profileErrSave}: ${result.message || ''}`, 3000);
      }
    } catch(e) {
      showToast(t.profileErrSave, 3000);
    }
    btn.disabled = false;
    btn.textContent = t.profileSaveBtn;
  });
}

async function loadAchievements() {
  try {
    const res = await authFetch(`${BASE_URL}/api/user/achievements?lang=${currentLang}`);
    const data = await res.json();
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;

    if (!data.achievements || data.achievements.length === 0) {
      grid.innerHTML = `<div style="color:#5599bb;font-size:0.85rem;width:100%;text-align:center;padding:12px 0;">—</div>`;
      return;
    }

    const visible = data.achievements.slice(0, 10);
    const hidden = data.achievements.slice(10);

    const showAllText = {
      ru: 'Показать все',
      en: 'Show all',
      fr: 'Tout afficher',
      es: 'Ver todo'
    };

    grid.innerHTML = visible.map(a => `
      <div class="achievement-item${a.unlocked ? '' : ' locked'}"
           data-emoji="${a.emoji}"
           data-title="${escapeHtml(a.title?.[currentLang] || a.title?.ru || a.key)}"
           data-unlocked="${a.unlocked}"
           title="${escapeHtml(a.title?.[currentLang] || a.title?.ru || a.key)}">
        <img src="${a.image || ''}" alt="${escapeHtml(a.title?.[currentLang] || a.key)}" style="width:44px;height:44px;border-radius:12px;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;font-size:24px;align-items:center;justify-content:center;">${a.emoji}</span>
      </div>
    `).join('');

    if (hidden.length > 0) {
      grid.insertAdjacentHTML('afterend', `
        <button class="referral-mini-btn" id="showAllAchBtn" style="margin-top:8px;font-size:0.85rem;">
          ${showAllText[currentLang] || showAllText.en} (${data.achievements.length})
        </button>
      `);
      document.getElementById('showAllAchBtn').addEventListener('click', () => {
        openAllAchievementsSheet(data.achievements);
      });
    }

    grid.querySelectorAll('.achievement-item').forEach(el => {
      el.addEventListener('click', () => {
        const title = el.dataset.title;
        const unlocked = el.dataset.unlocked === 'true';
        showToast(`${el.dataset.emoji} ${title}${unlocked ? ' ✅' : ' 🔒'}`, 3000);
      });
    });

  } catch(e) {
    const grid = document.getElementById('achievementsGrid');
    if (grid) grid.innerHTML = `<div style="color:#5599bb;font-size:0.85rem;width:100%;text-align:center;padding:12px 0;">—</div>`;
  }
}

function openAllAchievementsSheet(achievements) {
  const existing = document.getElementById('allAchSheet');
  if (existing) existing.remove();

  const showAllText = {
    ru: 'Все достижения',
    en: 'All achievements',
    fr: 'Tous les succès',
    es: 'Todos los logros'
  };

  const sheet = document.createElement('div');
  sheet.id = 'allAchSheet';
  sheet.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:1000;
    background:rgba(8,15,28,0.98);border-top:1px solid rgba(0,255,255,0.3);
    border-radius:28px 28px 0 0;padding:24px 20px 40px;
    max-height:80vh;overflow-y:auto;
    animation:fadeInUp 0.3s ease forwards;
  `;

  sheet.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <span style="font-size:1rem;font-weight:700;color:#00ffff;">${showAllText[currentLang] || showAllText.en}</span>
      <button id="allAchCloseBtn" style="background:rgba(255,255,255,0.08);border:none;border-radius:50%;width:32px;height:32px;color:#88aacc;font-size:1.1rem;cursor:pointer;">✕</button>
    </div>
    <div id="allAchGrid" style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;"></div>
  `;

  document.body.appendChild(sheet);

  document.getElementById('allAchCloseBtn').addEventListener('click', () => {
    document.getElementById('allAchSheet').remove();
  });

  const grid = document.getElementById('allAchGrid');
  achievements.forEach(a => {
    const title = a.title?.[currentLang] || a.title?.ru || a.key;
    const div = document.createElement('div');
    div.className = `achievement-item${a.unlocked ? '' : ' locked'}`;
    div.style.cssText = 'width:44px;height:44px;font-size:24px;border-radius:12px;';
    div.title = title;
    div.textContent = a.emoji;
    div.addEventListener('click', () => {
      showToast(`${a.emoji} ${title}${a.unlocked ? ' ✅' : ' 🔒'}`, 3000);
    });
    grid.appendChild(div);
  });
}
