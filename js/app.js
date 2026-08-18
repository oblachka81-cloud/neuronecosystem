// ==================== APP CORE ====================
let currentTab = 'game';

let currentState = {
  streakCount: 0,
  currentQuestion: null, selectedAnswer: null, answered: false, totalScore: 0,
  gameScore: 0, timer: null, timeLeft: 15, currentOptions: null, hintsUsed: [],
  gamesPlayed: 0, freeGamesLeft: 10, superGamePending: false, superGamesTotal: 0,
  myRank: '—', withdrawTickets: 0,
  superGameReplayUsed: false,
  lastGameWasSuper: false,
  pendingTimeout: null,
  selectedDailyOption: null,
  currentDailyOptions: null,
  dailyQSessionId: 0,
  channelBonusClaimed: !!localStorage.getItem('channelBonusClaimed')
};

window.root = document.getElementById('dynamicContent');
window.totalScoreSpan = document.getElementById('totalScoreBadge');
window.gamesLeftSpan = document.getElementById('gamesLeftBadge');

function updateScoresUI(totalScore) { 
  const badge = document.getElementById('totalScoreBadge');
  if(badge) {
    const span = badge.querySelector('span');
    if(span) span.textContent = totalScore.toLocaleString();
  }
}

function updateGamesLeftUI(n) { 
  const badge = document.getElementById('gamesLeftBadge');
  if(badge) {
    const span = badge.querySelector('span');
    if(span) span.textContent = n;
  }
}

function showToast(message, duration = 3000) {
  const existing = document.querySelector('.withdraw-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'withdraw-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function switchTab(tab) {
  currentTab = tab;
  
  const header = document.querySelector('.header');
  const footer = document.querySelector('footer');
  const logoImg = document.querySelector('.logo-wrap img');
  
  // Плавное затухание
  if (logoImg) logoImg.classList.add('loading');
  
  setTimeout(() => {
    if (tab === 'casino' || tab === 'fiat') {
      if (header) header.style.display = 'none';
      if (footer) footer.style.display = 'none';
    }
    else if (tab === 'exchange') {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
      if (logoImg) {
        logoImg.src = '/public/images/cogniq/exchange_logo.webp';
        logoImg.style.cssText = 'height:100px;width:auto;display:block;';
      }
    }
    else if (tab === 'bank') {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
      if (logoImg) {
        logoImg.src = 'main/bank_logo.webp';
        logoImg.style.cssText = 'height:100px;width:auto;display:block;';
      }
    } 
    else if (tab === 'shop') {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
      if (logoImg) {
        logoImg.src = 'shop/shop_logo.webp';
        logoImg.style.cssText = 'height:100px;width:auto;display:block;';
      }
    }
    else if (tab === 'support') {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
      if (logoImg) {
        logoImg.src = '/support/support_avatar.webp';
        logoImg.style.cssText = 'height:100px;width:auto;display:block;';
      }
    }
    else {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
      if (logoImg) {
        logoImg.src = 'main/game_logo.webp';
        logoImg.style.cssText = 'height:100px;width:auto;display:block;';
      }
    }
    
    // Плавное появление
    if (logoImg) logoImg.classList.remove('loading');
  }, 100);
  
  // Остальной код switchTab...
  document.getElementById('tabGame').classList.toggle('active', tab === 'game');
  document.getElementById('tabLeader').classList.toggle('active', tab === 'leaderboard');
  document.getElementById('tabWallet').classList.toggle('active', tab === 'wallet');
  document.getElementById('tabShop').classList.toggle('active', tab === 'shop');
  document.getElementById('tabProfile').classList.toggle('active', tab === 'profile');
  document.getElementById('tabBank').classList.toggle('active', tab === 'bank');
  document.getElementById('tabCasino').classList.toggle('active', tab === 'casino');
  document.getElementById('tabExchange').classList.toggle('active', tab === 'exchange');
  if (currentState.timer) { clearInterval(currentState.timer); currentState.timer = null; }
  if (currentState.pendingTimeout) { clearTimeout(currentState.pendingTimeout); currentState.pendingTimeout = null; }
  if (window._walletRefresh) { clearInterval(window._walletRefresh); window._walletRefresh = null; }
  if (tab === 'leaderboard') loadLeaderboard();
  else if (tab === 'wallet') showWalletPanel();
  else if (tab === 'shop') loadShopPanel();
  else if (tab === 'profile') loadProfilePanel();
  else if (tab === 'bank') loadBankPanel();
  else if (tab === 'casino') loadCasinoPanel();
  else if (tab === 'exchange') loadExchangePanel();
  else if (tab === 'support') loadSupportPanel();
  else loadWelcome();
}

function parseTgUser() {
  const u = tg.initDataUnsafe?.user;
  if (u?.id) return u;
  try {
    const raw = tg.initData;
    if (raw && raw.length > 0) {
      const params = new URLSearchParams(raw);
      const userStr = params.get('user');
      if (userStr) return JSON.parse(decodeURIComponent(userStr));
    }
  } catch(e) {}
  return null;
}

function startApp(attempt) {
  attempt = attempt || 1;
  const tgUser = parseTgUser();
  if (tgUser?.id) {
    userId = String(tgUser.id);
    userName = tgUser.first_name || tgUser.username || localStorage.getItem('neuron_uname') || 'Player';
    localStorage.setItem('neuron_uid', userId);
    localStorage.setItem('neuron_uname', userName);
  }
  if (!userId) {
    if (attempt < 8) { setTimeout(() => startApp(attempt + 1), 300); return; }
    userId = localStorage.getItem('neuron_uid') || ('dev_' + Math.random().toString(36).slice(2, 11));
    userName = localStorage.getItem('neuron_uname') || 'Player';
    localStorage.setItem('neuron_uid', userId);
    localStorage.setItem('neuron_uname', userName);
  }
  loadWelcome();
}

function loadWelcome(retryCount = 0) {
  const savedLastSuper = currentState.lastGameWasSuper;
  const savedReplayUsed = currentState.superGameReplayUsed;
  return new Promise((resolve) => {
    const safeName = userName || 'Player';
    authFetch(`${BASE_URL}/api/question?user_id=${userId}&name=${encodeURIComponent(safeName)}&lang=${currentLang}`)
      .then(r => r.json()).then(data => {
        if (data.error) {
          if (retryCount < 2) setTimeout(() => loadWelcome(retryCount + 1).then(resolve), 700);
          else { if(window._hideSplash) window._hideSplash(); root.innerHTML = `<div class="loader">${t.errAuth}</div>`; resolve(); }
          return;
        }
        currentState.totalScore = data.totalScore || 0;
        currentState.freeGamesLeft = data.freeGamesLeft !== undefined ? data.freeGamesLeft : 10;
        currentState.gamesPlayed = data.gamesPlayed || 0;
        currentState.superGamePending = data.superGamePending || false;
        currentState.superGamesTotal = data.superGamesTotal || 0;
        currentState.withdrawTickets = data.withdrawTickets || 0;
        currentState.lastGameWasSuper = savedLastSuper;
        currentState.superGameReplayUsed = savedReplayUsed;
        currentState.streakCount = data.streakCount || 0;
        currentState.channelBonusClaimed = data.channelBonusClaimed || false;
        updateScoresUI(currentState.totalScore);
        const streakBadge = document.getElementById('streakBadge');
        if(streakBadge) {
          const span = streakBadge.querySelector('span');
          if(span) span.textContent = currentState.streakCount || 0;
        }
        authFetch(`${BASE_URL}/api/impulse/balance`).then(r=>r.json()).then(d=>{
          const badge = document.getElementById('impulseScoreBadge');
          if(badge) {
            const span = badge.querySelector('span');
            if(span) span.textContent = (d.balance||0).toLocaleString();
          }
        }).catch(()=>{});
        updateGamesLeftUI(currentState.freeGamesLeft);
        showWelcome(currentState.totalScore, currentState.gamesPlayed);
        resolve();
      }).catch(() => {
        if (retryCount < 3) setTimeout(() => loadWelcome(retryCount + 1).then(resolve), 1000);
        else { if(window._hideSplash) window._hideSplash(); showWelcome(currentState.totalScore, currentState.gamesPlayed); resolve(); }
      });
  });
}
function preloadTabImages() {
  const imgs = [
    // Кошелёк
    '/wallet/wallet_balance_frame.webp',
    '/wallet/wallet_gram_frame.webp',
    '/wallet/wallet_usdt_frame.webp',
    '/wallet/wallet_connect_frame.webp',
    '/wallet/wallet_deposit_frame.webp',
    '/wallet/wallet_send_frame.webp',
    '/wallet/wallet_to_bank_frame.webp',
    '/wallet/btn_wallet_withdraw.webp',
    // Банк
    '/bank/bank_balance_frame.webp',
    '/bank/bank_deposit_frame.webp',
    '/bank/bank_term_30.webp',
    '/bank/bank_term_60.webp',
    '/bank/bank_term_90.webp',
    '/bank/bank_exchange_frame.webp',
    '/bank/bank_transfer_frame.webp',
    '/bank/bank_sell_frame.webp',
    // Профиль
    '/profile/profile_nickname_frame.webp',
    '/profile/profile_achievements_frame.webp',
    '/profile/profile_privacy_frame.webp',
    '/profile/profile_stats_frame.webp',
    '/profile/profile_avatar_frame.webp',
    // Магазин
    'shop/shop_pack_frame.webp',
    'shop/shop_vip_frame.webp',
    'shop/shop_premium_frame.webp',
    'shop/shop_impulse_frame.webp',
    'shop/shop_frame_card.webp',
    // Саппорт
    '/support/support_faq_btn.webp',
    '/support/support_mode_support.webp',
    '/support/support_mode_chat.webp'
  ];
  imgs.forEach(src => { const i = new Image(); i.src = src; });
}
// ==================== ПЛАВНЫЙ ПОКАЗ ВКЛАДОК ====================
(function() {
  const obs = new MutationObserver(() => {
    const imgs = root.querySelectorAll('img');
    if (!imgs.length) return;
    root.classList.add('panel-loading');
    let left = imgs.length;
    const done = () => { if (--left <= 0) root.classList.remove('panel-loading'); };
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
    setTimeout(() => root.classList.remove('panel-loading'), 700);
  });
  obs.observe(root, { childList: true });
})();
