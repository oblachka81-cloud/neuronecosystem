// ==================== ВИБРООТКЛИК (HAPTIC FEEDBACK) ====================

function vibrate(type = 'light') {
  try {
    const tg = window.Telegram?.WebApp;
    
    // 1. Проверяем, запущен ли вообще Telegram WebApp
    if (!tg) {
      if (typeof showToast === 'function') showToast('⚠️ Не в Telegram', 1500);
      return;
 }

    // 2. Проверяем, есть ли поддержка вибрации на этом устройстве
    if (tg.HapticFeedback) {
      if (['success', 'error', 'warning'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
      // Если всё ок, можно раскомментировать строку ниже для теста:
      // if (typeof showToast === 'function') showToast('✅ Вибрация: ' + type, 1000);
    } else {
      // 3. Если устройство не поддерживает вибрацию в WebView
      if (typeof showToast === 'function') showToast('⚠️ Вибрация не поддерживается', 1500);
    }
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ Ошибка Haptic', 1500);
  }
}
