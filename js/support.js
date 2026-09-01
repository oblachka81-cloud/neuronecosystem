// ==================== SUPPORT ====================
const SUPPORT_FAQ = {
  ru: [
    { q: '🎮 Как начать играть?', a: 'Нажмите "Играть" в главном меню. Отвечайте на 10 вопросов викторины и зарабатывайте COGNIQ за правильные ответы! 10 бесплатных игр в день.' },
    { q: '🪙 Что такое COGNIQ?', a: 'COGNIQ — игровой токен экосистемы NEURON на блокчейне TON. Саплай 5 миллиардов. Зарабатывайте в викторине, выводите на TON-кошелёк.' },
    { q: '🔥 Что такое Супер-игра?', a: 'Режим с x15 наградами! Стоит 50 Stars или 1 USDT. Даёт тикет на вывод COGNIQ.' },
    { q: '💸 Как вывести COGNIQ?', a: 'Подключите TON-кошелёк. Минимум 1000 COGNIQ + 1 тикет. Тикеты дают за супер-игры. Адрес проверяется AML-системой автоматически.' },
    { q: '🛡 Что такое AML-проверка?', a: 'При выводе адрес кошелька автоматически проверяется на связь со скамом, миксерами, даркнетом. Это защищает вас от отправки на опасные адреса.' },
    { q: '⚡ Что такое IMPULSE?', a: 'Внутренняя валюта для 5 казино-игр: FORTUNA, SPARK, XXI, KRASH, MINES. Покупайте за COGNIQ (1:5) или Stars. Ежедневный бонус 500 IMPULSE.' },
    { q: '💎 Чем VIP отличается от PREMIUM?', a: 'VIP (7 дней, 150 Stars): +10 игр/день. PREMIUM (30 дней, 400 Stars): +10 игр/день + эксклюзивная рамка аватара.' },
    { q: '🤝 Как работает рефералка?', a: 'Пригласите друга по ссылке: вам 200 COGNIQ, другу 100 COGNIQ на старт. Без ограничений по количеству друзей!' },
    { q: '📢 Бонус за подписку на канал?', a: 'Подпишитесь на @neuron_game_club и получите 200 COGNIQ. Один раз на аккаунт.' },
    { q: '🔥 Что такое стрики?', a: 'Играйте каждый день без пропусков! 3 дня +20 COGNIQ, 7 дней +70, 14 дней +150, 30 дней +350. Каждый день после 30-го +50 COGNIQ!' },
    { q: '♟ Как играть в шахматы?', a: 'Создайте дуэль со ставкой от 100 COGNIQ. Отправьте ссылку другу. Победитель забирает банк минус 5% сжигания.' },
    { q: '⚔️ Как создавать дуэли?', a: 'Нажмите "Дуэли" в меню. Установите ставку COGNIQ, получите ссылку. Отправьте другу — он принимает вызов и начинается битва!' },
    { q: '🔥 Что такое сжигание?', a: 'Часть COGNIQ сжигается навсегда: комиссии переводов, подсказки, повторы супер-игр, часть от ставок. Это дефляционная механика.' },
    { q: '🏦 Что такое Банк?', a: 'Стейкинг COGNIQ: 30 дней 5%, 60 дней 12%, 90 дней 20%. Обмен USDT→COGNIQ по курсу 1:200. Переводы между игроками (комиссия 1%).' },
    { q: '📊 Где статистика?', a: 'Вкладка "Профиль": ваш баланс, сыграно игр, стрик, достижения, история транзакций. Таблица лидеров показывает топ игроков.' },
    { q: '💱 Как работает биржа NEURON?', a: 'Некастодиально: активы остаются в твоём кошельке. Свап по лучшему DEX-курсу (STON.fi, DeDust, Megaton). Пары: TON, BTC, золото XAUt0, xStocks (акции Apple, Tesla, NVIDIA). Комиссия — только газ 5 COGNIQ.' },
    { q: '💳 Как купить крипто с карты?', a: 'Раздел Фиат: агрегаторы BestChange, Exchanger, MonitorEC — 500+ обменников, 43 000+ пар. Карты, банки, USD/EUR/AED. Лучший курс подбирается автоматически, 0% скрытых комиссий.' }
  ],
  en: [
    { q: '🎮 How to start?', a: 'Tap "Play" in the main menu. Answer 10 quiz questions and earn COGNIQ for correct answers! 10 free games per day.' },
    { q: '🪙 What is COGNIQ?', a: 'COGNIQ is the NEURON ecosystem token on TON blockchain. 5 billion supply. Earn in quiz, withdraw to TON wallet.' },
    { q: '🔥 Super Game?', a: 'x15 rewards mode! Costs 50 Stars or 1 USDT. Gives withdrawal ticket.' },
    { q: '💸 How to withdraw?', a: 'Connect TON wallet. Minimum 1000 COGNIQ + 1 ticket. Tickets come from super games. Address auto-checked by AML system.' },
    { q: '🛡 What is AML check?', a: 'When withdrawing, wallet address is auto-checked for links to scams, mixers, darknet. Protects you from sending to dangerous addresses.' },
    { q: '⚡ What is IMPULSE?', a: 'Internal currency for 5 casino games: FORTUNA, SPARK, XXI, KRASH, MINES. Buy with COGNIQ (1:5) or Stars. Daily bonus 500 IMPULSE.' },
    { q: '💎 VIP vs PREMIUM?', a: 'VIP (7 days, 150 Stars): +10 games/day. PREMIUM (30 days, 400 Stars): +10 games/day + exclusive avatar frame.' },
    { q: '🤝 How does referral work?', a: 'Invite friend via link: you get 200 COGNIQ, friend gets 100 COGNIQ to start. Unlimited friends!' },
    { q: '📢 Channel subscription bonus?', a: 'Subscribe to @neuron_game_club and get 200 COGNIQ. Once per account.' },
    { q: '🔥 What are streaks?', a: 'Play daily without missing! 3 days +20 COGNIQ, 7 days +70, 14 days +150, 30 days +350. Each day after 30th +50 COGNIQ!' },
    { q: '♟ How to play chess?', a: 'Create duel with stake from 100 COGNIQ. Send link to friend. Winner takes pot minus 5% burn.' },
    { q: '⚔️ How to create duels?', a: 'Tap "Duels" in menu. Set COGNIQ stake, get link. Send to friend — they accept and battle starts!' },
    { q: '🔥 What is burning?', a: 'Part of COGNIQ burned forever: transfer fees, hints, super game retries, part of stakes. Deflationary mechanic.' },
    { q: '🏦 What is Bank?', a: 'COGNIQ staking: 30 days 5%, 60 days 12%, 90 days 20%. USDT→COGNIQ exchange at 1:200. Transfers between players (1% fee).' },
    { q: '📊 Where is stats?', a: '"Profile" tab: your balance, games played, streak, achievements, transaction history. Leaderboard shows top players.' },
    { q: '💱 How does NEURON Exchange work?', a: 'Non-custodial: assets stay in your wallet. Swaps at best DEX rate (STON.fi, DeDust, Megaton). Pairs: TON, BTC, gold XAUt0, xStocks (Apple, Tesla, NVIDIA shares). Fee — only 5 COGNIQ gas.' },
    { q: '💳 How to buy crypto with card?', a: 'Fiat section: BestChange, Exchanger, MonitorEC aggregators — 500+ exchangers, 43,000+ pairs. Cards, banks, USD/EUR/AED. Best rate auto-selected, 0% hidden fees.' }
  ],
  fr: [
    { q: '🎮 Comment jouer?', a: 'Appuie sur "Jouer" dans le menu. Réponds à 10 questions et gagne des COGNIQ! 10 parties gratuites par jour.' },
    { q: '🪙 Qu\'est-ce que COGNIQ?', a: 'COGNIQ est le token de l\'écosystème NEURON sur TON. Offre de 5 milliards. Gagne dans le quiz, retire vers portefeuille TON.' },
    { q: '🔥 Super Jeu?', a: 'Mode x15 récompenses! Coûte 50 Stars ou 1 USDT. Donne un ticket de retrait.' },
    { q: '💸 Retirer COGNIQ?', a: 'Connecte portefeuille TON. Minimum 1000 COGNIQ + 1 ticket. Les tickets viennent des super jeux. Adresse vérifiée par système AML.' },
    { q: '🛡 Qu\'est-ce que vérif AML?', a: 'Lors du retrait, l\'adresse est vérifiée pour liens avec arnaques, mixeurs, darknet. Te protège des adresses dangereuses.' },
    { q: '⚡ IMPULSE?', a: 'Monnaie interne pour 5 jeux casino: FORTUNA, SPARK, XXI, KRASH, MINES. Achète avec COGNIQ (1:5) ou Stars. Bonus quotidien 500 IMPULSE.' },
    { q: '💎 VIP vs PREMIUM?', a: 'VIP (7j, 150 Stars): +10 parties/jour. PREMIUM (30j, 400 Stars): +10 parties/jour + cadre avatar exclusif.' },
    { q: '🤝 Comment fonctionne parrainage?', a: 'Invite ami via lien: tu reçois 200 COGNIQ, ami reçoit 100 COGNIQ pour commencer. Amis illimités!' },
    { q: '📢 Bonus abonnement chaîne?', a: 'Abonne-toi à @neuron_game_club et reçois 200 COGNIQ. Une fois par compte.' },
    { q: '🔥 Qu\'est-ce que séries?', a: 'Joue quotidiennement sans manquer! 3 jours +20 COGNIQ, 7 jours +70, 14 jours +150, 30 jours +350. Chaque jour après 30e +50 COGNIQ!' },
    { q: '♟ Comment jouer échecs?', a: 'Crée duel avec mise dès 100 COGNIQ. Envoie lien à ami. Gagnant prend pot moins 5% brûlé.' },
    { q: '⚔️ Comment créer duels?', a: 'Appuie "Duels" dans menu. Fixe mise COGNIQ, obtiens lien. Envoie à ami — il accepte et bataille commence!' },
    { q: '🔥 Qu\'est-ce que brûlage?', a: 'Partie de COGNIQ brûlée pour toujours: frais transferts, indices, retries super jeu, partie des mises. Mécanique déflationniste.' },
    { q: '🏦 Qu\'est-ce que Banque?', a: 'Staking COGNIQ: 30j 5%, 60j 12%, 90j 20%. Échange USDT→COGNIQ à 1:200. Transferts entre joueurs (1% frais).' },
    { q: '📊 Où sont stats?', a: 'Onglet "Profil": ton solde, parties jouées, série, achievements, historique transactions. Classement montre meilleurs joueurs.' },
    { q: '💱 Comment marche NEURON Exchange?', a: 'Non-custodial: tes actifs restent dans ton portefeuille. Swap au meilleur taux DEX (STON.fi, DeDust, Megaton). Paires: TON, BTC, or XAUt0, xStocks (actions Apple, Tesla, NVIDIA). Frais — seulement 5 COGNIQ de gaz.' },
    { q: '💳 Acheter crypto avec carte?', a: 'Section Fiat: agrégateurs BestChange, Exchanger, MonitorEC — 500+ échangeurs, 43 000+ paires. Cartes, banques, USD/EUR/AED. Meilleur taux auto-sélectionné, 0% frais cachés.' }
  ],
  es: [
    { q: '🎮 ¿Cómo jugar?', a: 'Pulsa "Jugar" en el menú. Responde 10 preguntas y gana COGNIQ! 10 partidas gratis al día.' },
    { q: '🪙 ¿Qué es COGNIQ?', a: 'COGNIQ es el token del ecosistema NEURON en TON. Oferta de 5 mil millones. Gana en quiz, retira a billetera TON.' },
    { q: '🔥 ¿Super Juego?', a: 'Modo x15 recompensas! Cuesta 50 Stars o 1 USDT. Da ticket de retiro.' },
    { q: '💸 ¿Retirar COGNIQ?', a: 'Conecta billetera TON. Mínimo 1000 COGNIQ + 1 ticket. Los tickets vienen de super juegos. Dirección verificada por sistema AML.' },
    { q: '🛡 ¿Qué es verificación AML?', a: 'Al retirar, la dirección se verifica por vínculos con estafas, mezcladores, darknet. Te protege de direcciones peligrosas.' },
    { q: '⚡ ¿IMPULSE?', a: 'Moneda interna para 5 juegos casino: FORTUNA, SPARK, XXI, KRASH, MINES. Compra con COGNIQ (1:5) o Stars. Bono diario 500 IMPULSE.' },
    { q: '💎 ¿VIP vs PREMIUM?', a: 'VIP (7d, 150 Stars): +10 partidas/día. PREMIUM (30d, 400 Stars): +10 partidas/día + marco avatar exclusivo.' },
    { q: '🤝 ¿Cómo funciona referido?', a: 'Invita amigo vía enlace: tú recibes 200 COGNIQ, amigo recibe 100 COGNIQ para empezar. Amigos ilimitados!' },
    { q: '📢 ¿Bono suscripción canal?', a: 'Suscríbete a @neuron_game_club y recibe 200 COGNIQ. Una vez por cuenta.' },
    { q: '🔥 ¿Qué son rachas?', a: 'Juega diariamente sin faltar! 3 días +20 COGNIQ, 7 días +70, 14 días +150, 30 días +350. Cada día después del 30 +50 COGNIQ!' },
    { q: '♟ ¿Cómo jugar ajedrez?', a: 'Crea duelo con apuesta desde 100 COGNIQ. Envía enlace a amigo. Ganador toma bote menos 5% quemado.' },
    { q: '⚔️ ¿Cómo crear duelos?', a: 'Pulsa "Duelos" en menú. Fija apuesta COGNIQ, obtén enlace. Envía a amigo — él acepta y batalla comienza!' },
    { q: '🔥 ¿Qué es quema?', a: 'Parte de COGNIQ quemada para siempre: comisiones transferencias, pistas, reintentos super juego, parte de apuestas. Mecánica deflacionaria.' },
    { q: '🏦 ¿Qué es Banco?', a: 'Staking COGNIQ: 30d 5%, 60d 12%, 90d 20%. Intercambio USDT→COGNIQ a 1:200. Transferencias entre jugadores (1% comisión).' },
    { q: '📊 ¿Dónde están stats?', a: 'Pestaña "Perfil": tu saldo, partidas jugadas, racha, logros, historial transacciones. Tabla clasificación muestra mejores jugadores.' },
    { q: '💱 ¿Cómo funciona NEURON Exchange?', a: 'No custodial: tus activos quedan en tu billetera. Swap al mejor precio DEX (STON.fi, DeDust, Megaton). Pares: TON, BTC, oro XAUt0, xStocks (acciones Apple, Tesla, NVIDIA). Comisión — solo 5 COGNIQ de gas.' },
    { q: '💳 ¿Comprar crypto con tarjeta?', a: 'Sección Fiat: agregadores BestChange, Exchanger, MonitorEC — 500+ cambiadores, 43,000+ pares. Tarjetas, bancos, USD/EUR/AED. Mejor tasa automática, 0% comisiones ocultas.' }
  ]
};

const SUPPORT_UI = {
  ru: { input_ph: 'Задайте вопрос...', ai_err: 'Извините, не смог ответить.', conn_err: 'Ошибка связи.', footer: 'Официальная поддержка экосистемы NEURON © 2026' },
  en: { input_ph: 'Ask a question...', ai_err: 'Sorry, could not answer.', conn_err: 'Connection error.', footer: 'Official NEURON Ecosystem Support © 2026' },
  fr: { input_ph: 'Posez une question...', ai_err: 'Désolé, pas pu répondre.', conn_err: 'Erreur de connexion.', footer: 'Support officiel NEURON © 2026' },
  es: { input_ph: 'Haz una pregunta...', ai_err: 'Lo siento, no pude responder.', conn_err: 'Error de conexión.', footer: 'Soporte oficial NEURON © 2026' }
};

let supportMode = 'support';

async function loadSupportPanel() {
  // Подтягиваем данные пользователя для аватарки в чате
  if (!window.currentUser) {
    try {
      const res = await authFetch(`${BASE_URL}/api/user/profile?lang=${currentLang}`);
      const data = await res.json();
      if (!data.error) window.currentUser = data;
    } catch(e) {}
  }
  
  const s = SUPPORT_UI[currentLang] || SUPPORT_UI['ru'];
  
  root.innerHTML = `
    <div class="support-card" style="max-width:480px;width:100%;margin:0 auto;padding:16px;display:flex;flex-direction:column;height:calc(100vh - 140px);min-height:400px;">
  
      <button onclick="supportOpenFAQ()" style="background:none;border:none;padding:0;cursor:pointer;width:100%;margin-bottom:8px;">
        <img src="/support/support_faq_btn.webp" style="width:100%;height:36px;display:block;object-fit:contain;">
      </button>

      <div id="supportFaqModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;justify-content:center;align-items:flex-start;padding-top:60px;" onclick="if(event.target===this)supportCloseFAQ()">
        <div style="background:rgba(10,20,38,0.95);backdrop-filter:blur(15px);border:1px solid rgba(255,170,0,0.3);border-radius:24px;padding:20px;width:90%;max-width:480px;max-height:80vh;overflow-y:auto;position:relative;">
          <button style="position:sticky;top:0;float:right;background:none;border:none;color:#ffaa00;font-size:1.5rem;cursor:pointer;" onclick="supportCloseFAQ()">✕</button>
          <div id="supportFaqList"></div>
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:8px;">
        <button id="supportModeSupport" onclick="supportSetMode('support')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;${supportMode === 'support' ? 'filter:brightness(1.3)drop-shadow(0 0 6px #f472b6);' : ''}">
          <img src="/support/support_mode_support.webp" style="width:100%;height:auto;display:block;">
        </button>
        <button id="supportModeChat" onclick="supportSetMode('chat')" style="background:none;border:none;padding:0;cursor:pointer;flex:1;${supportMode === 'chat' ? 'filter:brightness(1.3)drop-shadow(0 0 6px #f472b6);' : ''}">
          <img src="/support/support_mode_chat.webp" style="width:100%;height:auto;display:block;">
        </button>
      </div>

      <div id="supportChatMessages" style="flex:1;overflow-y:auto;margin-bottom:8px;padding:8px 0;"></div>

      <div style="display:flex;gap:8px;padding:8px 0 12px 0;">
        <input id="supportChatInput" placeholder="${s.input_ph}" style="flex:1;padding:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(0,255,170,0.3);border-radius:12px;color:#fff;font-size:0.9rem;outline:none;">
        <button onclick="supportSendMessage()" style="padding:12px 16px;border:none;border-radius:12px;color:#000;font-weight:800;cursor:pointer;background:linear-gradient(90deg,#00ffaa,#00cc88);">➤</button>
      </div>

      <div style="text-align:center;padding:6px 0 10px 0;font-size:0.7rem;color:rgba(255,255,255,0.25);letter-spacing:1px;">${s.footer}</div>
    </div>
  `;
  
  supportRenderFAQ();
}

function supportSetMode(mode) {
  supportMode = mode;
  document.getElementById('supportModeSupport').style.filter = mode === 'support' ? 'brightness(1.3) drop-shadow(0 0 6px #f472b6)' : 'brightness(0.5)';
  document.getElementById('supportModeChat').style.filter = mode === 'chat' ? 'brightness(1.3) drop-shadow(0 0 6px #f472b6)' : 'brightness(0.5)';
}

function supportOpenFAQ() {
  document.getElementById('supportFaqModal').style.display = 'flex';
}

function supportCloseFAQ() {
  document.getElementById('supportFaqModal').style.display = 'none';
}

function supportRenderFAQ() {
  const faqList = SUPPORT_FAQ[currentLang] || SUPPORT_FAQ['ru'];
  const list = document.getElementById('supportFaqList');
  if (!list) return;
  
  list.innerHTML = faqList.map(item => `
    <div class="faq-card" style="background:rgba(10,20,38,0.7);border:1px solid rgba(255,170,0,0.2);border-radius:20px;padding:16px;margin-bottom:8px;cursor:pointer;">
      <div style="font-size:0.9rem;font-weight:700;color:#ffaa00;">${item.q}</div>
      <div class="faq-a" style="font-size:0.82rem;color:#ccddee;line-height:1.5;display:none;margin-top:8px;">${item.a}</div>
    </div>
  `).join('');
  
  list.querySelectorAll('.faq-card').forEach(card => {
    card.addEventListener('click', function() {
      const a = this.querySelector('.faq-a');
      a.style.display = (a.style.display === 'block') ? 'none' : 'block';
    });
  });
}

function supportAddMessage(text, type) {
  const container = document.getElementById('supportChatMessages');
  const div = document.createElement('div');
  
  if (type === 'ai') {
    // СООБЩЕНИЕ ОТ БОТА (слева)
    div.style.cssText = `margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;max-width:85%;`;
    div.innerHTML = `
      <img src="/support/support_avatar.webp" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;border:1px solid rgba(102,204,255,0.3);">
      <div style="flex:1;color:#66ccff;font-weight:600;font-size:0.85rem;line-height:1.4;word-break:break-word;">${text}</div>
    `;
  } else {
    // СООБЩЕНИЕ ОТ ПОЛЬЗОВАТЕЛЯ (справа)
    div.style.cssText = `margin-bottom:8px;display:flex;align-items:flex-start;gap:8px;flex-direction:row-reverse;justify-content:flex-end;max-width:85%;margin-left:auto;`;
    
    // Берем аватарку из глобальной переменной currentUser (как в профиле)
    // Предполагаем, что window.currentUser.photo_url заполняется при загрузке профиля
    const userPhoto = window.currentUser?.photo_url 
      ? BASE_URL + window.currentUser.photo_url 
      : '/main/game_logo.webp';
    
    div.innerHTML = `
      <img src="${userPhoto}" onerror="this.src='/main/game_logo.webp'" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;border:1px solid rgba(255,204,102,0.3);object-fit:cover;">
      <div style="flex:1;text-align:right;color:#ffcc66;font-weight:500;font-size:0.85rem;line-height:1.4;word-break:break-word;">${text}</div>
    `;
  }
  
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function supportSendMessage() {
  const input = document.getElementById('supportChatInput');
  const msg = input.value.trim();
  if (!msg) return;
  
  supportAddMessage(msg, 'user');
  input.value = '';
  
  try {
    const r = await authFetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, lang: currentLang, mode: supportMode })
    });
    const data = await r.json();
    supportAddMessage(data.reply || 'Извините, не смог ответить.', 'ai');
  } catch (e) {
    supportAddMessage('❌ Ошибка связи.', 'ai');
  }
}
