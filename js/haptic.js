// ==================== ВИБРООТКЛИК (HAPTIC FEEDBACK) ====================

// 1. Диагностический оверлей (исчезнет через 5 секунд)
(function() {
  const isTg = !!window.Telegram?.WebApp;
  const hasHaptic = !!(window.Telegram?.WebApp?.HapticFeedback);
  const hasVibrate = !!(navigator.vibrate);
  const platform = window.Telegram?.WebApp?.platform || (navigator.userAgent.match(/Android/i) ? 'Android' : 'iOS');

  const debugDiv = document.createElement('div');
  debugDiv.style.cssText = 'position:fixed;top:10px;left:10px;right:10px;background:rgba(0,0,0,0.9);color:#00ffaa;padding:12px;border-radius:12px;font-size:13px;font-family:monospace;z-index:99999;border:1px solid #00ffaa;';
  debugDiv.innerHTML = `
    <div>Платформа: <b>${platform}</b></div>
    <div>Telegram WebApp: <b>${isTg ? 'ДА' : 'НЕТ'}</b></div>
    <div>HapticFeedback API: <b>${hasHaptic ? 'ДА' : 'НЕТ'}</b></div>
    <div>navigator.vibrate: <b>${hasVibrate ? 'ДА' : 'НЕТ'}</b></div>
    <div id="haptic-log" style="color:#ffcc44;margin-top:6px;">Ожидание клика...</div>
  `;
  document.body.appendChild(debugDiv);
  setTimeout(() => debugDiv.remove(), 5000);
})();

function vibrate(type = 'light') {
  const logEl = document.getElementById('haptic-log');
  if (logEl) logEl.textContent = `Вызов vibrate('${type}')...`;

  try {
    const tgApp = window.Telegram?.WebApp;

    // 1. Telegram Haptic
    if (tgApp && tgApp.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tgApp.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        tgApp.HapticFeedback.selectionChanged();
      } else {
        const allowed = ['light', 'medium', 'heavy', 'rigid', 'soft'];
        tgApp.HapticFeedback.impactOccurred(allowed.includes(type) ? type : 'light');
      }
      if (logEl) logEl.textContent = `✅ Сработал Telegram Haptic (${type})`;
      return true;
    }

    // 2. Фоллбэк для браузера
    if (navigator.vibrate) {
      const patterns = {
  light: [30], medium: [60], heavy: [100],
  success: [100, 60, 100], error: [120, 50, 120], warning: [80, 40, 80], selection: [25]
};
      navigator.vibrate(patterns[type] || 20);
      if (logEl) logEl.textContent = `✅ Сработал navigator.vibrate (${type})`;
      return true;
    }

      if (logEl) logEl.textContent = `❌ Нет поддержки вибрации на этом устройстве`;

    // 3. Звуковой фоллбэк для Android
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'success') {
        osc.frequency.value = 880;
        gain.gain.value = 0.15;
        osc.start();
        setTimeout(() => { osc.frequency.value = 1320; }, 60);
        setTimeout(() => osc.stop(), 140);
      } else if (type === 'error') {
        osc.frequency.value = 220;
        gain.gain.value = 0.12;
        osc.start();
        setTimeout(() => osc.stop(), 150);
      } else {
        osc.frequency.value = 660;
        gain.gain.value = 0.08;
        osc.start();
        setTimeout(() => osc.stop(), 30);
      }
      if (logEl) logEl.textContent = `🔊 Звуковой фоллбэк (${type})`;
    } catch(e) {
      if (logEl) logEl.textContent = `❌ Звук тоже не работает: ${e.message}`;
    }
  } catch (e) {
    if (logEl) logEl.textContent = `❌ Ошибка: ${e.message}`;
  }
  return false;
}

window.vibrate = vibrate;

// Авто-вибрация на все кликабельные элементы
document.addEventListener('click', function (e) {
  const el = e.target.closest('button, [role="button"], .btn, .answer-btn, .stake-btn, a, .tab-btn, .hint-btn, .replay-btn, .casino-tab, .wheel-bet-btn');
  
  // НЕ вибрируем на табах — там своя вибрация в switchTab
  if (el && el.classList.contains('tab-btn')) return;
  
  // НЕ вибрируем на ответах викторины и слотах — там своя логика
  if (el && el.classList.contains('answer-btn')) return;
  if (el && el.id === 'casinoSlotSpinBtn') return;
  if (el && el.classList.contains('wheel-bet-btn')) return;
  
  if (el && !el.disabled && !el.classList.contains('no-haptic')) {
    setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(110);
      if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }, 50);
  }
}, true);
