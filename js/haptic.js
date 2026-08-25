// ==================== ВИБРООТКЛИК (HAPTIC FEEDBACK) ====================
// Функция для тактильного отклика в Telegram WebApp

function vibrate(type = 'light') {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.HapticFeedback) {
      // Уведомления (успех, ошибка, предупреждение)
      if (['success', 'error', 'warning'].includes(type)) {
        tg.HapticFeedback.notificationOccurred(type);
      } 
      // Физические удары (light, medium, heavy, rigid, soft)
      else {
        tg.HapticFeedback.impactOccurred(type);
      }
    }
  } catch (e) {
    // Игнорируем ошибки, если открыто не в Telegram
  }
}
