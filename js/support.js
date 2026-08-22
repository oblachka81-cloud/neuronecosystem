// ==================== SUPPORT ====================
const SUPPORT_FAQ = {
  ru: [
    { q: '🎮 Как начать играть?', a: 'Нажмите "Играть" в главном меню. Отвечайте на 10 вопросов викторины и зарабатывайте COGNIQ за правильные ответы!' },
    { q: '🪙 Что такое COGNIQ?', a: 'COGNIQ — игровой токен экосистемы NEURON на блокчейне TON.' },
    { q: '🔥 Что такое Супер-игра?', a: 'Это режим с x15 наградами! Стоит 100 Stars или 1 USDT.' },
    { q: '💸 Как вывести COGNIQ?', a: 'Подключите TON-кошелек. Нужен 1 тикет и 1000 COGNIQ.' },
    { q: '⚡ Что такое IMPULSE?', a: 'IMPULSE — 5 игр (FORTUNA, SPARK, XXI, KRASH, MINES). Валюта: IMPULSE.' },
    { q: '💎 Чем VIP отличается от PREMIUM?', a: 'VIP (7 дней): +10 игр/день. PREMIUM (30 дней): +10 игр/день, рамка.' }
  ],
  en: [
    { q: '🎮 How to start?', a: 'Open "Play", answer quiz questions and earn COGNIQ!' },
    { q: '🪙 What is COGNIQ?', a: 'COGNIQ is the NEURON token on TON.' },
    { q: '🔥 Super Game?', a: 'x15 rewards! 100 Stars or 1 USDT.' },
    { q: '💸 How to withdraw?', a: 'Connect TON wallet. 1 ticket + 1000 COGNIQ.' },
    { q: '⚡ What is IMPULSE?', a: '5 games. Currency: IMPULSE.' },
    { q: '💎 VIP vs PREMIUM?', a: 'VIP 7d: +10 games/day. PREMIUM 30d: +10 games/day, frame.' }
  ],
  fr: [
    { q: '🎮 Comment jouer?', a: 'Ouvre "Jouer", réponds aux questions et gagne des COGNIQ!' },
    { q: '🪙 Qu\'est-ce que COGNIQ?', a: 'COGNIQ est le token NEURON sur TON.' },
    { q: '🔥 Super Jeu?', a: 'Mode x15! 100 Stars ou 1 USDT.' },
    { q: '💸 Retirer COGNIQ?', a: 'Connecte portefeuille TON. 1 ticket + 1000 COGNIQ.' },
    { q: '⚡ IMPULSE?', a: '5 jeux. Monnaie: IMPULSE.' },
    { q: '💎 VIP vs PREMIUM?', a: 'VIP 7j: +10 parties/jour. PREMIUM 30j: +10 parties/jour, cadre.' }
  ],
  es: [
    { q: '🎮 ¿Cómo jugar?', a: 'Abre "Jugar", responde preguntas y gana COGNIQ!' },
    { q: '🪙 ¿Qué es COGNIQ?', a: 'COGNIQ es el token NEURON en TON.' },
    { q: '🔥 ¿Super Juego?', a: 'Modo x15! 100 Stars o 1 USDT.' },
    { q: '💸 ¿Retirar COGNIQ?', a: 'Conecta billetera TON. 1 ticket + 1000 COGNIQ.' },
    { q: '⚡ ¿IMPULSE?', a: '5 juegos. Moneda: IMPULSE.' },
    { q: '💎 ¿VIP vs PREMIUM?', a: 'VIP 7d: +10 partidas/día. PREMIUM 30d: +10 partidas/día, marco.' }
  ]
};

const SUPPORT_UI = {
  ru: { input_ph: 'Задайте вопрос...', ai_err: 'Извините, не смог ответить.', conn_err: 'Ошибка связи.', footer: 'Официальная поддержка экосистемы NEURON © 2026' },
  en: { input_ph: 'Ask a question...', ai_err: 'Sorry, could not answer.', conn_err: 'Connection error.', footer: 'Official NEURON Ecosystem Support © 2026' },
  fr: { input_ph: 'Posez une question...', ai_err: 'Désolé, pas pu répondre.', conn_err: 'Erreur de connexion.', footer: 'Support officiel NEURON © 2026' },
  es: { input_ph: 'Haz una pregunta...', ai_err: 'Lo siento, no pude responder.', conn_err: 'Error de conexión.', footer: 'Soporte oficial NEURON © 2026' }
};

let supportMode = 'support';

function loadSupportPanel() {
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
  document.getElementById('supportFaqList').innerHTML = faqList.map(item => `
    <div class="faq-card" onclick="this.classList.toggle('open')" style="background:rgba(10,20,38,0.7);border:1px solid rgba(255,170,0,0.2);border-radius:20px;padding:16px;margin-bottom:8px;cursor:pointer;">
      <div style="font-size:0.9rem;font-weight:700;color:#ffaa00;">${item.q}</div>
      <div class="faq-a" style="font-size:0.82rem;color:#ccddee;line-height:1.5;display:none;margin-top:8px;">${item.a}</div>
    </div>
  `).join('');
  
  document.querySelectorAll('.faq-card').forEach(card => {
    card.addEventListener('click', function() {
      this.classList.toggle('open');
      const a = this.querySelector('.faq-a');
      if (a) a.style.display = this.classList.contains('open') ? 'block' : 'none';
    });
  });
}

function supportAddMessage(text, type) {
  const container = document.getElementById('supportChatMessages');
  const div = document.createElement('div');
  div.style.cssText = `margin-bottom:8px;padding:8px 12px;border-radius:12px;font-size:0.85rem;line-height:1.4;max-width:100%;display:flex;align-items:flex-start;gap:8px;`;
  
  // Получаем фото пользователя из Telegram WebApp, либо ставим заглушку, если его нет
  const userPhoto = window.Telegram?.WebApp?.user?.photo_url || '/support/default_user.webp';
  
  if (type === 'ai') {
    div.innerHTML = `
      <img src="/support/support_avatar.webp" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;border:1px solid rgba(102,204,255,0.3);">
      <div style="flex:1;color:#66ccff;font-weight:600;word-break:break-word;">${text}</div>
    `;
  } else {
    // Для пользователя: текст справа, аватарка справа от текста (через flex-direction или порядок элементов)
    div.style.flexDirection = 'row-reverse'; // Меняем порядок: сначала текст, потом картинка
    div.innerHTML = `
      <div style="flex:1;text-align:right;color:#ffcc66;font-weight:500;word-break:break-word;">${text}</div>
      <img src="${userPhoto}" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;border:1px solid rgba(255,204,102,0.3);object-fit:cover;">
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
