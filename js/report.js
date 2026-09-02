// ==================== НЕДЕЛЬНЫЙ ОТЧЁТ ====================

const REPORT_LANG = {
  ru: {
    title: 'НЕДЕЛЬНЫЙ ОТЧЁТ',
    activity: 'АКТИВНОСТЬ',
    quiz: 'Викторин',
    quizEarned: 'COGNIQ с викторин',
    duels: 'Дуэлей',
    duelsWon: 'побед',
    chess: 'Шахмат',
    chessWon: 'побед',
    cogniq: 'COGNIQ',
    earned: 'Заработано',
    spent: 'Потрачено',
    net: 'Чистый профит',
    converted: 'В IMPULSE',
    staked: 'В банк',
    transferredOut: 'Отправлено',
    transferredIn: 'Получено',
    burned: 'Сожжено',
    impulse: 'IMPULSE',
    bets: 'Ставок',
    betSum: 'Поставлено',
    won: 'Выиграно',
    lost: 'Проиграно',
    bestWin: 'Лучший занос',
    bank: 'БАНК',
    bankBuys: 'Покупок',
    achievements: 'ДОСТИЖЕНИЯ',
    newAchievements: 'Новых',
    streak: 'Стрик',
    days: 'дн.',
    tickets: 'Тикетов на вывод',
    rank: 'РАНГ',
    balance: 'Баланс',
    delta: 'vs прошлая неделя',
    newWeek: 'Первая неделя!',
    close: 'Закрыть',
    loading: 'Загрузка отчёта...',
    error: 'Ошибка загрузки',
    noData: 'Пока пусто. Играй!',
  },
  en: {
    title: 'WEEKLY REPORT',
    activity: 'ACTIVITY',
    quiz: 'Quizzes',
    quizEarned: 'COGNIQ from quizzes',
    duels: 'Duels',
    duelsWon: 'won',
    chess: 'Chess',
    chessWon: 'won',
    cogniq: 'COGNIQ',
    earned: 'Earned',
    spent: 'Spent',
    net: 'Net profit',
    converted: 'To IMPULSE',
    staked: 'Staked',
    transferredOut: 'Sent',
    transferredIn: 'Received',
    burned: 'Burned',
    impulse: 'IMPULSE',
    bets: 'Bets',
    betSum: 'Wagered',
    won: 'Won',
    lost: 'Lost',
    bestWin: 'Best win',
    bank: 'BANK',
    bankBuys: 'Buys',
    achievements: 'ACHIEVEMENTS',
    newAchievements: 'New',
    streak: 'Streak',
    days: 'days',
    tickets: 'Withdraw tickets',
    rank: 'RANK',
    balance: 'Balance',
    delta: 'vs last week',
    newWeek: 'First week!',
    close: 'Close',
    loading: 'Loading report...',
    error: 'Load error',
    noData: 'Empty yet. Play!',
  },
  fr: {
    title: 'RAPPORT HEBDOMADAIRE',
    activity: 'ACTIVITÉ',
    quiz: 'Quiz',
    quizEarned: 'COGNIQ des quiz',
    duels: 'Duels',
    duelsWon: 'gagnés',
    chess: 'Échecs',
    chessWon: 'gagnées',
    cogniq: 'COGNIQ',
    earned: 'Gagné',
    spent: 'Dépensé',
    net: 'Bénéfice net',
    converted: 'En IMPULSE',
    staked: 'Placé',
    transferredOut: 'Envoyé',
    transferredIn: 'Reçu',
    burned: 'Brûlé',
    impulse: 'IMPULSE',
    bets: 'Mises',
    betSum: 'Misé',
    won: 'Gagné',
    lost: 'Perdu',
    bestWin: 'Meilleur gain',
    bank: 'BANQUE',
    bankBuys: 'Achats',
    achievements: 'SUCCÈS',
    newAchievements: 'Nouveaux',
    streak: 'Série',
    days: 'j.',
    tickets: 'Tickets de retrait',
    rank: 'RANG',
    balance: 'Solde',
    delta: 'vs sem. dernière',
    newWeek: 'Première semaine !',
    close: 'Fermer',
    loading: 'Chargement...',
    error: 'Erreur',
    noData: 'Vide encore. Joue !',
  },
  es: {
    title: 'INFORME SEMANAL',
    activity: 'ACTIVIDAD',
    quiz: 'Quizzes',
    quizEarned: 'COGNIQ de quizzes',
    duels: 'Duelos',
    duelsWon: 'ganados',
    chess: 'Ajedrez',
    chessWon: 'ganadas',
    cogniq: 'COGNIQ',
    earned: 'Ganado',
    spent: 'Gastado',
    net: 'Beneficio neto',
    converted: 'A IMPULSE',
    staked: 'Depositado',
    transferredOut: 'Enviado',
    transferredIn: 'Recibido',
    burned: 'Quemado',
    impulse: 'IMPULSE',
    bets: 'Apuestas',
    betSum: 'Apostado',
    won: 'Ganado',
    lost: 'Perdido',
    bestWin: 'Mejor ganancia',
    bank: 'BANCO',
    bankBuys: 'Compras',
    achievements: 'LOGROS',
    newAchievements: 'Nuevos',
    streak: 'Racha',
    days: 'días',
    tickets: 'Tickets de retiro',
    rank: 'RANGO',
    balance: 'Saldo',
    delta: 'vs sem. pasada',
    newWeek: '¡Primera semana!',
    close: 'Cerrar',
    loading: 'Cargando...',
    error: 'Error',
    noData: 'Vacío aún. ¡Juega!',
  }
};

function reportT() {
  return REPORT_LANG[currentLang] || REPORT_LANG.en;
}

const row = (label, value, color = '#fff') =>
  `<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><span style="color:#a0aac0;">${label}</span><span style="color:${color};font-weight:700;">${value}</span></div>`;

const section = (emoji, title, color, html) =>
  `<div style="margin-bottom:18px;">
     <div style="font-size:0.7rem;font-weight:800;color:${color};letter-spacing:1.2px;text-transform:uppercase;margin-bottom:9px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:6px;">${emoji} ${title}</div>
     ${html}
   </div>`;

async function openWeeklyReport() {
  const t = reportT();

  const existing = document.getElementById('weeklyReportModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'weeklyReportModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;';

  modal.innerHTML = `
    <div style="background:rgba(10,15,30,0.95);border:1.5px solid rgba(220,220,225,0.35);border-radius:20px;padding:22px 20px;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 0 40px rgba(0,0,0,0.6);backdrop-filter:blur(12px);">
      <div style="text-align:center;margin-bottom:18px;">
        <div style="font-size:1.15rem;font-weight:900;background:linear-gradient(90deg,#ffcc44 0%,#fff3c4 50%,#ffcc44 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:1.5px;text-transform:uppercase;">${t.title}</div>
      </div>
      <div id="weeklyReportContent" style="font-size:0.83rem;color:#c8d0e0;">
        <div style="text-align:center;padding:20px;color:#00ccff;">${t.loading}</div>
      </div>
      <button onclick="document.getElementById('weeklyReportModal').remove()" style="width:100%;padding:12px;margin-top:14px;background:linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));border:1px solid rgba(255,255,255,0.12);border-radius:40px;font-size:0.85rem;font-weight:700;color:#a0aac0;cursor:pointer;">
        ${t.close}
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  try {
    const res = await authFetch(`${BASE_URL}/api/weekly-report?lang=${currentLang}`);
    const data = await res.json();

    if (!data.success) {
      document.getElementById('weeklyReportContent').innerHTML = `<div style="text-align:center;color:#ff6464;">${t.error}</div>`;
      return;
    }

    const fmt = n => (n ?? 0).toLocaleString();
    const netColor = data.cogniq.net > 0 ? '#00ffaa' : data.cogniq.net < 0 ? '#ff6464' : '#a0aac0';
    const netSign = data.cogniq.net > 0 ? '+' : '';
    const impNet = data.impulse.net;
    const impNetColor = impNet > 0 ? '#00ffaa' : impNet < 0 ? '#ff6464' : '#a0aac0';
    const impNetSign = impNet > 0 ? '+' : '';

    // Дельта активности
    const prevGames = data.delta?.gamesPrev ?? 0;
    const curGames = (data.activity?.quiz ?? 0) + (data.activity?.duels?.total ?? 0) + (data.activity?.chess?.total ?? 0);
    let deltaHtml;
    if (prevGames === 0 && curGames === 0) {
      deltaHtml = `<span style="color:#a0aac0;font-style:italic;font-weight:500;">${t.noData}</span>`;
    } else if (prevGames === 0) {
      deltaHtml = `<span style="color:#ffcc44;font-weight:700;">🆕 ${t.newWeek}</span>`;
    } else {
      const pct = Math.round(((curGames - prevGames) / prevGames) * 100);
      const dColor = pct > 0 ? '#00ffaa' : pct < 0 ? '#ff6464' : '#a0aac0';
      const dSign = pct > 0 ? '+' : '';
      deltaHtml = `<span style="color:${dColor};font-weight:700;">${dSign}${pct}% ${t.delta}</span>`;
    }

    // АКТИВНОСТЬ
    const actHtml = `
      ${row(t.quiz, `${fmt(data.activity.quiz)} <span style="color:#00ffaa;font-size:0.75rem;">(+${fmt(data.activity.quizEarned)} C)</span>`)}
      ${row(t.duels, `${fmt(data.activity.duels.total)} <span style="color:#00ffaa;font-size:0.75rem;">(${fmt(data.activity.duels.won)} ${t.duelsWon})</span>`)}
      ${row(t.chess, `${fmt(data.activity.chess.total)} <span style="color:#00ffaa;font-size:0.75rem;">(${fmt(data.activity.chess.won)} ${t.chessWon})</span>`)}
      ${row(t.streak, `${fmt(data.streak)} ${t.days}`)}
      <div style="text-align:center;margin-top:8px;font-size:0.72rem;">${deltaHtml}</div>
    `;

    // COGNIQ
    const cogniqHtml = `
      ${row(t.earned, `+${fmt(data.cogniq.earned)}`, '#00ffaa')}
      ${row(t.spent, `-${fmt(data.cogniq.spent)}`, '#ff6464')}
      <div style="height:1px;background:rgba(255,255,255,0.08);margin:8px 0;"></div>
      ${row(t.net, `${netSign}${fmt(data.cogniq.net)}`, netColor)}
      <div style="height:1px;background:rgba(255,255,255,0.08);margin:8px 0;"></div>
      ${row(t.converted, fmt(data.cogniq.converted), '#a855f7')}
      ${row(t.staked, fmt(data.cogniq.staked), '#ffcc44')}
      ${row(t.transferredOut, fmt(data.cogniq.transferredOut), '#a0aac0')}
      ${row(t.transferredIn, fmt(data.cogniq.transferredIn), '#a0aac0')}
      ${data.cogniq.burned > 0 ? row(t.burned, `🔥 ${fmt(data.cogniq.burned)}`, '#ff8800') : ''}
    `;

    // БАНК
    let bankHtml = '';
    if (data.cogniq.bankBuys > 0) {
      bankHtml = section('🏦', t.bank, '#00ccff', `
        ${row(t.bankBuys, fmt(data.cogniq.bankBuys))}
        ${row('USDT', `$${fmt(data.cogniq.bankUsdt)}`, '#00ffaa')}
        ${row('COGNIQ', fmt(data.cogniq.bankCogniq), '#00ffff')}
      `);
    }

    // IMPULSE
    const impHtml = `
      ${row(t.bets, fmt(data.impulse.bets))}
      ${row(t.betSum, fmt(data.impulse.betSum))}
      ${row(t.won, `+${fmt(data.impulse.won)}`, '#00ffaa')}
      ${row(t.lost, `-${fmt(data.impulse.lost)}`, '#ff6464')}
      <div style="height:1px;background:rgba(255,255,255,0.08);margin:8px 0;"></div>
      ${row(t.net, `${impNetSign}${fmt(impNet)}`, impNetColor)}
      ${data.impulse.bestWin > 0 ? `<div style="margin-top:10px;padding:10px 12px;border:1px solid rgba(255,136,0,0.4);border-radius:10px;background:linear-gradient(135deg,rgba(255,136,0,0.1),rgba(255,80,0,0.05));text-align:center;"><div style="font-size:0.65rem;color:#ff8800;text-transform:uppercase;letter-spacing:1px;font-weight:700;">🔥 ${t.bestWin}</div><div style="font-size:1.1rem;font-weight:900;color:#ffcc44;margin-top:4px;">+${fmt(data.impulse.bestWin)} IMPULSE</div></div>` : ''}
    `;

    // ДОСТИЖЕНИЯ + ТИКЕТЫ
    const achHtml = `
      ${row(t.newAchievements, fmt(data.achievements.new), '#ffcc44')}
      ${row(t.tickets, fmt(data.withdrawTickets), '#00ffff')}
    `;

    // РАНГ
    const rankHtml = `
      <div style="text-align:center;padding:10px 0;">
        <div style="font-size:1.5rem;margin-bottom:4px;">${data.rank.emoji}</div>
        <div style="font-size:1rem;font-weight:800;color:#ffcc44;">${data.rank.title}</div>
        <div style="font-size:0.75rem;color:#8899bb;margin-top:4px;">${t.balance}: <span style="color:#fff;font-weight:700;">${fmt(data.rank.balance)}</span></div>
      </div>
    `;

    document.getElementById('weeklyReportContent').innerHTML = `
      ${section('🎮', t.activity, '#00ccff', actHtml)}
      ${section('💰', t.cogniq, '#ffcc44', cogniqHtml)}
      ${bankHtml}
      ${section('🎰', t.impulse, '#a855f7', impHtml)}
      ${section('🏅', t.achievements, '#00ffaa', achHtml)}
      ${section('⚡', t.rank, '#ffcc44', rankHtml)}
    `;

  } catch (e) {
    console.error('weekly-report error:', e);
    document.getElementById('weeklyReportContent').innerHTML = `<div style="text-align:center;color:#ff6464;">${t.error}</div>`;
  }
}

window.openWeeklyReport = openWeeklyReport;
window.REPORT_LANG = REPORT_LANG;
