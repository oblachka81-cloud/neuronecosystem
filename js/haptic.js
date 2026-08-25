// ==================== ВИБРООТКЛИК (HAPTIC FEEDBACK) ====================

function vibrate(type = 'light') {
  try {
    const tg = window.Telegram?.WebApp;
    
    // Пробуем через Telegram HapticFeedback
    if (tg && tg.HapticFeedback) {
      if (['success', 'error', 'warning'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
      return;
    }
    
    // Фоллбэк: стандартная вибрация браузера (Android)
    if (navigator.vibrate) {
      const patterns = {
        'light': 10,
        'medium': 20,
        'heavy': 40,
        'success': [30, 50, 30],
        'error': [50, 30, 50],
        'warning': [30, 30, 30]
      };
      navigator.vibrate(patterns[type] || 20);
    }
  } catch (e) {
    // Тихо игнорируем
  }
}
