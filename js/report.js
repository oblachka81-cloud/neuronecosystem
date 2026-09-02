// ==================== НЕДЕЛЬНЫЙ ОТЧЁТ ====================

const REPORT_LANG = {
  ru: {
    title: 'НЕДЕЛЬНЫЙ ОТЧЁТ',
    activity: 'АКТИВНОСТЬ',
    quiz: 'Викторин',
    duels: 'Дуэлей',
    duelsWon: 'побед',
    chess: 'Шахмат',
    chessWon: 'побед',
    cogniq: 'COGNIQ',
    earned: 'Заработано',
    spent: 'Потрачено',
    burned: 'Сожжено',
    impulse: 'IMPULSE',
    bets: 'Ставок',
    won: 'Выиграно',
    lost: 'Проиграно',
    achievements: 'Достижения',
    newAchievements: 'Новых',
    rank: 'Ранг',
    close: 'Закрыть',
    loading: 'Загрузка отчёта...',
    error: 'Ошибка загрузки'
  },
  en: {
    title: 'WEEKLY REPORT',
    activity: 'ACTIVITY',
    quiz: 'Quizzes',
    duels: 'Duels',
    duelsWon: 'won',
    chess: 'Chess',
    chessWon: 'won',
    cogniq: 'COGNIQ',
    earned: 'Earned',
    spent: 'Spent',
    burned: 'Burned',
    impulse: 'IMPULSE',
    bets: 'Bets',
    won: 'Won',
    lost: 'Lost',
    achievements: 'Achievements',
    newAchievements: 'New',
    rank: 'Rank',
    close: 'Close',
    loading: 'Loading report...',
    error: 'Load error'
  },
  fr: {
    title: 'RAPPORT HEBDOMADAIRE',
    activity: 'ACTIVITÉ',
    quiz: 'Quiz',
    duels: 'Duels',
    duelsWon: 'gagnés',
    chess: 'Échecs',
    chessWon: 'gagnées',
    cogniq: 'COGNIQ',
    earned: 'Gagné',
    spent: 'Dépensé',
    burned: 'Brûlé',
    impulse: 'IMPULSE',
    bets: 'Mises',
    won: 'Gagné',
    lost: 'Perdu',
    achievements: 'Succès',
    newAchievements: 'Nouveaux',
    rank: 'Rang',
    close: 'Fermer',
    loading: 'Chargement...',
    error: 'Erreur'
  },
  es: {
    title: 'INFORME SEMANAL',
    activity: 'ACTIVIDAD',
    quiz: 'Quizzes',
    duels: 'Duelos',
    duelsWon: 'ganados',
    chess: 'Ajedrez',
    chessWon: 'ganadas',
    cogniq: 'COGNIQ',
    earned: 'Ganado',
    spent: 'Gastado',
    burned: 'Quemado',
    impulse: 'IMPULSE',
    bets: 'Apuestas',
    won: 'Ganado',
    lost: 'Perdido',
    achievements: 'Logros',
    newAchievements: 'Nuevos',
    rank: 'Rango',
    close: 'Cerrar',
    loading: 'Cargando...',
    error: 'Error'
  }
};

function reportT() {
  return REPORT_LANG[currentLang] || REPORT_LANG.en;
}

async function openWeeklyReport() {
  const t = reportT();
  
  // Создаём модалку
  const existing = document.getElementById('weeklyReportModal');
  if (existing) existing.remove();
  
  const modal = document.createElement('div');
  modal.id = 'weeklyReportModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);';
  
  modal.innerHTML = `
    <div style="background:rgba(10,15,30,0.98);border:1.5px solid rgba(220,220,225,0.5);border-radius:20px;padding:24px 20px;max-width:400px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 0 30px rgba(220,220,225,0.1);">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:1.2rem;font-weight:800;background:linear-gradient(90deg,#ffcc44 0%,#fff3c4 50%,#ffcc44 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:1px;text-transform:uppercase;">📊 ${t.title}</div>
      </div>
      <div id="weeklyReportContent" style="font-size:0.85rem;color:#c8d0e0;">
        <div style="text-align:center;padding:20px;color:#00ccff;">${t.loading}</div>
      </div>
      <button onclick="document.getElementById('weeklyReportModal').remove()" style="width:100%;padding:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:40px;font-size:0.85rem;font-weight:600;color:#8899aa;cursor:pointer;margin-top:16px;">
        ${t.close}
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // Загружаем данные
  try {
    const res = await authFetch(`${BASE_URL}/api/weekly-report?lang=${currentLang}`);
    const data = await res.json();
    
    if (!data.success) {
      document.getElementById('weeklyReportContent').innerHTML = `<div style="text-align:center;color:#ff6464;">${t.error}</div>`;
      return;
    }
    
    document.getElementById('weeklyReportContent').innerHTML = `
      <div style="margin-bottom:16px;">
        <div style="font-size:0.7rem;font-weight:700;color:#00ccff;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">🎮 ${t.activity}</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${t.quiz}</span><span style="color:#fff;font-weight:700;">${data.quiz.games}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${t.duels}</span><span style="color:#fff;font-weight:700;">${data.duels.total} <span style="color:#00ffaa;">(${data.duels.won} ${t.duelsWon})</span></span></div>
        <div style="display:flex;justify-content:space-between;"><span>${t.chess}</span><span style="color:#fff;font-weight:700;">${data.chess.total} <span style="color:#00ffaa;">(${data.chess.won} ${t.chessWon})</span></span></div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-size:0.7rem;font-weight:700;color:#ffcc44;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">💰 ${t.cogniq}</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${t.earned}</span><span style="color:#00ffaa;font-weight:700;">+${data.cogniq.earned.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${t.spent}</span><span style="color:#ff6464;font-weight:700;">-${data.cogniq.spent.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>${t.burned}</span><span style="color:#ff8800;font-weight:700;">🔥 ${data.cogniq.burned.toLocaleString()}</span></div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-size:0.7rem;font-weight:700;color:#a855f7;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">🎰 ${t.impulse}</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${t.bets}</span><span style="color:#fff;font-weight:700;">${data.impulse.bets}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${t.won}</span><span style="color:#00ffaa;font-weight:700;">+${data.impulse.won.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between;"><span>${t.lost}</span><span style="color:#ff6464;font-weight:700;">-${data.impulse.lost.toLocaleString()}</span></div>
      </div>
      
      <div style="margin-bottom:16px;">
        <div style="font-size:0.7rem;font-weight:700;color:#00ffaa;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">🏅 ${t.achievements}</div>
        <div style="display:flex;justify-content:space-between;"><span>${t.newAchievements}</span><span style="color:#fff;font-weight:700;">${data.achievements.new}</span></div>
      </div>
      
      <div>
        <div style="font-size:0.7rem;font-weight:700;color:#ffcc44;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">⚡ ${t.rank}</div>
        <div style="text-align:center;font-size:1.1rem;font-weight:800;color:#ffcc44;">${data.rank.emoji} ${data.rank.title}</div>
      </div>
    `;
    
  } catch (e) {
    document.getElementById('weeklyReportContent').innerHTML = `<div style="text-align:center;color:#ff6464;">${t.error}</div>`;
  }
}

// Глобальные функции
window.openWeeklyReport = openWeeklyReport;
window.REPORT_LANG = REPORT_LANG;
