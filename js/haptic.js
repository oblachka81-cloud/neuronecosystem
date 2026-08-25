// ==================== ВИБРООТКЛИК (HAPTIC FEEDBACK) ====================

function vibrate(type = 'light') {
  try {
    const tgApp = window.Telegram?.WebApp;

    // Telegram Haptic (только мобильный клиент)
    if (tgApp && tgApp.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tgApp.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        tgApp.HapticFeedback.selectionChanged();
      } else {
        const allowed = ['light', 'medium', 'heavy', 'rigid', 'soft'];
        tgApp.HapticFeedback.impactOccurred(allowed.includes(type) ? type : 'light');
      }
      return true;
    }

    // Фоллбэк Android-браузер
    if (navigator.vibrate) {
      const patterns = {
        light: 15,
        medium: 25,
        heavy: 45,
        success: [35, 50, 35],
        error: [50, 40, 50],
        warning: [30, 30, 30],
        selection: 12
      };
      navigator.vibrate(patterns[type] || 20);
      return true;
    }
  } catch (e) {
    console.warn('vibrate error:', e);
  }
  return false;
}

window.vibrate = vibrate;

// Авто-вибрация на все кнопки
document.addEventListener('click', function (e) {
  const el = e.target.closest('button, [role="button"], .btn, .answer-btn, .stake-btn, a.button');
  if (el && !el.disabled && !el.classList.contains('no-haptic')) {
    vibrate('light');
  }
}, true);
