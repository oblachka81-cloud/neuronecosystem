// ==================== КАЗИНО ====================
function loadCasinoPanel() {
  let balance = 0;
  
  // 1. Очистка
  const old = document.getElementById('casinoContainer');
  if (old) old.remove();
  const oldP = document.getElementById('casinoParticlesContainer');
  if (oldP) oldP.remove();

  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const casinoBtn = document.getElementById('tabCasino');
  if (casinoBtn) casinoBtn.classList.add('active');

  // 2. Переводы
  const ct = {
  ru: { 
    balance: 'Доступно IMPULSE', back: 'На главную', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'История', spin: 'Крутить', bet: 'Ставка', cashout: 'Забрать', start: 'Начать', hit: 'Ещё', stand: 'Стоп', deal: 'Раздать',
    waiting: '⏳ СЛЕДУЮЩИЙ РАУНД...', betting: '🔥 ДЕЛАЙ СТАВКУ!', flying: '🚀 ЛЕТИМ! ЖМИ ЗАБРАТЬ!', crashed: '💥 КРАШ!',
    waitingStatus: 'Подождите...', bettingStatus: 'Успей за 3 секунды!', flyingStatus: 'Забирай до краша!'
  },
  en: { 
    balance: 'Available IMPULSE', back: 'Back to Main', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'History', spin: 'Spin', bet: 'Bet', cashout: 'Cash Out', start: 'Start', hit: 'Hit', stand: 'Stand', deal: 'Deal',
    waiting: '⏳ NEXT ROUND...', betting: '🔥 PLACE YOUR BET!', flying: '🚀 FLYING! CASH OUT!', crashed: '💥 CRASHED!',
    waitingStatus: 'Wait...', bettingStatus: 'Bet within 3 seconds!', flyingStatus: 'Cash out before crash!'
  },
  fr: { 
    balance: 'IMPULSE disponible', back: 'Retour', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'Historique', spin: 'Tourner', bet: 'Mise', cashout: 'Retirer', start: 'Commencer', hit: 'Tirer', stand: 'Rester', deal: 'Distribuer',
    waiting: '⏳ PROCHAIN TOUR...', betting: '🔥 PLACEZ VOTRE MISE!', flying: '🚀 ÇA VOLE ! RETIREZ !', crashed: '💥 CRASH !',
    waitingStatus: 'Attendez...', bettingStatus: 'Pariez dans 3 secondes !', flyingStatus: 'Retirez avant le crash !'
  },
  es: { 
    balance: 'IMPULSE disponible', back: 'Volver', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'Historial', spin: 'Girar', bet: 'Apuesta', cashout: 'Retirar', start: 'Iniciar', hit: 'Pedir', stand: 'Plantarse', deal: 'Repartir',
    waiting: '⏳ PRÓXIMA RONDA...', betting: '🔥 ¡HAZ TU APUESTA!', flying: '🚀 ¡VOLANDO! ¡RETIRA!', crashed: '💥 ¡CRASH!',
    waitingStatus: 'Espera...', bettingStatus: '¡Apuesta en 3 segundos!', flyingStatus: '¡Retira antes del crash!'
  }
}[currentLang] || { 
  balance: 'Available IMPULSE', back: 'Back', roulette: '🎡 FORTUNA', slots: '⚡ SPARK', crash: '💥 CRASH', bj: '🔮 XXI', mines: '💣 MINES', history: 'History', spin: 'Spin', bet: 'Bet', cashout: 'Cash Out', start: 'Start', hit: 'Hit', stand: 'Stand', deal: 'Deal',
  waiting: '⏳ NEXT ROUND...', betting: '🔥 PLACE YOUR BET!', flying: '🚀 FLYING! CASH OUT!', crashed: '💥 CRASHED!',
  waitingStatus: 'Wait...', bettingStatus: 'Bet within 3 seconds!', flyingStatus: 'Cash out before crash!'
};

  // 3. HTML Структура (ВСТАВЬ СЮДА ВЕСЬ casinoContainer.innerHTML БЛОК)
  const casinoContainer = document.createElement('div');
  casinoContainer.id = 'casinoContainer';
  casinoContainer.className = 'casino-wrapper';
  casinoContainer.innerHTML = `
    <div class="casino-card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
    <button id="casinoBackBtn" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img id="casinoBackBtnImg" src="/games/casino/back_btn_${currentLang}.webp" style="height:44px;width:auto;display:block;">
    </button>
    <button id="casinoDailyImpulseBtn" onclick="window.casinoClaimDailyImpulse()" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img id="casinoDailyImpulseBtnImg" src="/games/casino/btn_daily_impulse.webp" style="height:44px;width:auto;display:block;">
    </button>
  </div>
  <div class="neuron-logo">
    <img src="/games/casino/neuron_logo.webp" alt="NEURON" style="height:128px;width:auto;display:block;">
  </div>
  <div class="casino-tabs" style="display:flex;gap:4px;background:transparent;border:none;padding:0;">
    <button class="casino-tab active" data-tab="roulette" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/games/casino/tab_btn_fortuna.webp" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="slots" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/games/casino/tab_btn_spark.webp" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="crash" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/games/casino/tab_btn_crash.webp" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="blackjack" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/games/casino/tab_btn_xxi.webp" style="width:100%;height:auto;display:block;">
    </button>
    <button class="casino-tab" data-tab="mines" style="background:none;border:none;padding:0;cursor:pointer;flex:1;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
      <img src="/games/casino/tab_btn_mines.webp" style="width:100%;height:auto;display:block;">
    </button>
  </div>
  <div class="balance-row" style="margin-bottom:2px;">
    <div class="balance-label" id="casinoBalanceLabel">Available IMPULSE</div>
    <div class="balance-amount" id="casinoBalanceAmount">—</div>
  </div>

       <!-- ROULETTE -->
      <div id="casinoSectionRoulette" class="casino-game-section">
        <div class="wheel-panel" style="padding:80px 20px 14px;margin-bottom:2px;">
          <div class="wheel-wrap" style="position:relative;width:min(330px,65vw,50vh);height:min(330px,65vw,50vh);margin:0 auto 16px;filter:drop-shadow(0 0 24px rgba(255,140,0,0.5));">
            <div class="wheel-pointer" style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);font-size:1.4rem;color:#ffd700;filter:drop-shadow(0 0 10px #ffaa00);z-index:2;">▼</div>
            <canvas id="casinoWheelCanvas" class="wheel-svg" width="220" height="220" style="width:100%;height:100%;border-radius:50%;box-shadow:0 0 50px rgba(255,170,0,0.4), 0 0 100px rgba(255,80,0,0.2);"></canvas>
            <div class="wheel-center" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:58px;height:58px;background:radial-gradient(circle,#1e2e48,#07111f);border:3px solid #ffaa00;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 0 24px rgba(255,170,0,0.7),inset 0 0 16px rgba(0,0,0,0.5);">
              <span class="wheel-center-num" id="casinoWheelResult" style="font-size:1.4rem;font-weight:900;color:#ffaa00;">?</span>
            </div>
          </div>
        </div>
        <button id="casinoSpinBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;margin-bottom:14px;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">
          <img id="casinoSpinBtnImg" src="/games/fortuna/fortuna_btn_spin_${currentLang}.webp" style="width:100%;height:auto;display:block;">
        </button>
        <div class="result-color" id="casinoRouletteResultColor" style="font-size:1rem;font-weight:700;margin-top:6px;text-align:center;min-height:24px;margin-bottom:4px;"></div>
        <div class="result-message" id="casinoRouletteResultMsg" style="font-size:0.88rem;margin-top:4px;color:#aabbcc;text-align:center;min-height:20px;margin-bottom:12px;"></div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/fortuna/fortuna_bets_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" alt="">
          <div class="bet-form" style="position:relative;z-index:1;background:none;border:none;padding:24px 18px 18px 18px;">
            <div class="input-row" style="display:flex;gap:10px;margin-bottom:12px;"><input type="number" id="casinoRouletteBet" placeholder="Amount (10-100 IMPULSE)" min="10" max="100" style="flex:1;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;transition:border-color 0.2s,box-shadow 0.2s;"></div>
            <div class="bet-types" id="casinoRouletteBetTypes" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
              <button class="wheel-bet-btn" data-type="red" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_red.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="black" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_black.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="even" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_even.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="odd" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_odd.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="low" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_low.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="high" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_high.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen1" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_dozen1.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen2" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_dozen2.webp" style="width:100%;height:auto;display:block;"></button>
              <button class="wheel-bet-btn" data-type="dozen3" style="background:none;border:none;padding:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;"><img src="/games/fortuna/fortuna_btn_dozen3.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
          </div>
        </div>
        <div class="section-title" id="casinoRouletteHistoryTitle" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoRouletteHistory"></div>
      </div>

      <!-- SLOTS -->
      <div id="casinoSectionSlots" class="casino-game-section" style="display:none;">
        <div class="slot-machine" style="position:relative;margin-bottom:20px;padding:28px 32px 22px;">
          <img src="/games/spark/spark_machine_bg.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:2;">
            <div id="casinoSlotReels" style="display:flex;gap:3px;justify-content:center;margin-bottom:20px;padding-top:40px;"></div>
            <div style="text-align:center;min-height:54px;margin-bottom:6px;">
              <div id="casinoSlotResultCombo" style="font-size:1.6rem;font-weight:900;letter-spacing:8px;min-height:32px;"></div>
              <div id="casinoSlotResultMsg" style="font-size:0.9rem;margin-top:6px;font-weight:700;"></div>
            </div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/spark/spark_bets_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoSlotBet" placeholder="${ct.bet} (10-100)" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:flex;gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetSlotBet(10)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_10.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(25)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_25.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(50)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_50.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetSlotBet(100)" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/spark/btn_bet_100.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
            <button id="casinoSlotSpinBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img src="/games/spark/btn_spin.webp" style="width:100%;height:auto;display:block;"></button>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoSlotHistory"></div>
      </div>

      <!-- CRASH -->
      <div id="casinoSectionCrash" class="casino-game-section" style="display:none;">
        <div style="position:relative;margin-bottom:14px;border-radius:18px;overflow:hidden;">
          <img src="/games/krash/crash_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:8px;">
            <div style="position:relative;margin-bottom:12px;">
              <img id="casinoCrashBg" src="/games/krash/krash_display_bg_active.webp" style="width:100%;height:auto;display:block;">
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
                <div style="text-align:center;pointer-events:none;">
                  <div id="casinoCrashMult" style="font-size:3.2em;font-weight:900;color:#10b981;text-shadow:0 0 30px currentColor;">---</div>
                  <div id="casinoCrashLabel" style="font-size:0.72em;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-top:4px;color:#556677;">ОЖИДАНИЕ</div>
                </div>
              </div>
              <canvas id="casinoCrashCanvas" style="position:absolute;bottom:0;left:0;width:100%;height:220px;z-index:2;"></canvas>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;background:rgba(5,5,20,0.9);border:1px solid rgba(255,170,0,0.15);border-radius:12px;padding:10px 16px;font-size:0.83em;">
              <div style="display:flex;align-items:center;gap:8px;"><div id="casinoCrashDot" style="width:10px;height:10px;border-radius:50%;background:#334;"></div><span id="casinoCrashStatus" style="color:#aaa;">${ct.bet}...</span></div>
              <div id="casinoCrashTimer" style="color:#556;"></div>
            </div>
            <div id="casinoCrashMyBet" style="display:none;justify-content:space-between;align-items:center;margin-bottom:12px;background:linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.06));border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:10px 16px;">
              <div><div style="font-size:0.78em;color:#556;">${ct.bet}</div><div id="casinoCrashBetAmount" style="font-weight:800;color:#a855f7;">0</div></div>
              <div style="text-align:right;"><div style="font-size:0.78em;color:#556;">${ct.cashout}</div><div id="casinoCrashPotential" style="font-weight:700;color:#10b981;">0</div></div>
            </div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/krash/crash_bet_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoCrashBetInput" value="50" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">
              <button onclick="window.casinoSetCrashBet(10)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/krash/krash_btn_10.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetCrashBet(25)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/krash/krash_btn_25.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetCrashBet(50)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/krash/krash_btn_50.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetCrashBet(100)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/krash/krash_btn_100.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
            <button id="casinoCrashMainBtn" style="background:none;border:none;padding:0;cursor:pointer;width:100%;"><img id="casinoCrashMainBtnImg" src="/games/krash/krash_btn_main_bet_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoCrashHistory" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
      </div>

      <!-- BLACKJACK -->
      <div id="casinoSectionBlackjack" class="casino-game-section" style="display:none;">
        <div style="position:relative;min-height:300px;margin-bottom:14px;">
          <img src="/games/xxi/xxi_table.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;border-radius:24px;opacity:0.8;" alt="">
          <div style="position:relative;z-index:1;border-radius:24px;min-height:300px;display:flex;flex-direction:column;justify-content:space-between;padding:12px 16px;">
            <div style="flex:1;display:flex;align-items:flex-start;justify-content:center;padding-top:4px;">
              <div id="casinoBjDealerCards" style="display:flex;flex-wrap:wrap;gap:10px;min-height:88px;align-items:center;justify-content:center;"></div>
            </div>
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:4px;">
              <div id="casinoBjPlayerCards" style="display:flex;flex-wrap:wrap;gap:10px;min-height:88px;align-items:center;justify-content:center;"></div>
              <div id="casinoBjResultBanner" style="text-align:center;font-size:1.2em;font-weight:900;padding:12px;border-radius:14px;margin:8px 0;display:none;"></div>
            </div>
          </div>
        </div>
        
        <div id="casinoBjInsuranceBar" style="display:none;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.35);border-radius:12px;padding:10px 14px;margin-bottom:10px;font-size:0.83em;color:#c084fc;text-align:center;cursor:pointer;"></div>
        
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/xxi/xxi_bet_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoBjBet" value="50" min="10" max="500" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetBjBet(10)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/xxi_btn_10.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(25)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/xxi_btn_25.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(50)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/xxi_btn_50.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(100)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/xxi_btn_100.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetBjBet(250)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/xxi_btn_250.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <button id="casinoBjDealBtn" style="grid-column:span 2;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/bj_deal_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjHitBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/bj_hit_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjStandBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/bj_stand_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjDoubleBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/bj_double_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoBjSplitBtn" disabled style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/xxi/bj_split_${currentLang}.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoBjHistory"></div>
      </div>

      <!-- MINES -->
      <div id="casinoSectionMines" class="casino-game-section" style="display:none;">
        <div style="position:relative;margin-bottom:16px;border-radius:0;">
          <img src="/games/mines/mines_field_bg.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:22px 23px 10px 8px;text-align:center;">
            <div style="font-size:0.85rem;color:#ffaa00;margin-bottom:8px;">💣 MINES</div>
            <div id="casinoMinesMult" style="font-size:1.8rem;font-weight:900;color:#ffaa00;text-shadow:0 0 20px rgba(255,170,0,0.7);margin-bottom:8px;min-height:44px;">x1.00</div>
            <div id="casinoMinesField" style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;margin-bottom:16px;"></div>
          </div>
        </div>
        <div style="position:relative;margin-bottom:14px;">
          <img src="/games/mines/mines_bets_frame.webp" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none;" alt="">
          <div style="position:relative;z-index:1;padding:18px;">
            <input type="number" id="casinoMinesBet" value="50" min="10" max="100" style="width:100%;padding:11px 14px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:12px;color:#fff;font-size:0.95rem;outline:none;margin-bottom:10px;">
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;">
              <button onclick="window.casinoSetMinesBet(10)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_10.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(25)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_25.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(50)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_50.webp" style="width:100%;height:auto;display:block;"></button>
              <button onclick="window.casinoSetMinesBet(100)" style="background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_100.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
              <label style="font-size:0.8rem;color:#5577aa;white-space:nowrap;">💣 Мин:</label>
              <input type="number" id="casinoMinesCount" min="1" max="24" value="3" style="width:60px;padding:8px 10px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,170,0,0.2);border-radius:10px;color:#fff;font-size:0.95rem;outline:none;text-align:center;">
              <input type="range" id="casinoMinesRange" min="1" max="24" value="3" style="flex:1;accent-color:#ffaa00;">
            </div>
            <div style="display:flex;gap:12px;">
              <button id="casinoMinesCashoutBtn" style="flex:1;background:none;border:none;padding:0;cursor:pointer;display:none;"><img src="/games/mines/mines_btn_cashout.webp" style="width:100%;height:auto;display:block;"></button>
              <button id="casinoMinesStartBtn" style="flex:1;background:none;border:none;padding:0;cursor:pointer;"><img src="/games/mines/mines_btn_start.webp" style="width:100%;height:auto;display:block;"></button>
            </div>
          </div>
        </div>
        <div class="section-title" style="font-size:0.72rem;font-weight:700;color:#445577;text-transform:uppercase;letter-spacing:2px;margin-bottom:10px;">${ct.history}</div>
        <div id="casinoMinesHistory"></div>
      </div>

    </div>
    
    <!-- Jackpot Overlay -->
    <div id="casinoJackpotOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:1000;align-items:center;justify-content:center;flex-direction:column;gap:14px;">
      <div style="font-size:5rem;animation:brainPop 0.5s cubic-bezier(0.36,0.07,0.19,0.97) both;filter:drop-shadow(0 0 30px #ff00ff);">🧠</div>
      <div style="font-size:3rem;font-weight:900;background:linear-gradient(90deg, #ff00ff, #ffaa00, #00ffff, #ff00ff);background-size:300% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:gradientShift 1.5s linear infinite;">JACKPOT!</div>
      <div id="casinoJackpotAmount" style="font-size:2rem;font-weight:900;color:#ffaa00;text-shadow:0 0 30px rgba(255,170,0,0.8);"></div>
      <button onclick="window.casinoCloseJackpot()" style="padding:14px 44px;background:linear-gradient(90deg, #ff00ff, #9900ff);border:none;border-radius:14px;color:#fff;font-size:1rem;font-weight:800;cursor:pointer;box-shadow:0 0 30px rgba(255,0,255,0.5);">COLLECT 🎉</button>
    </div>
  `;

  document.body.appendChild(casinoContainer);

// 4. Частицы
const pContainer = document.createElement('div');
pContainer.id = 'casinoParticlesContainer';
pContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;overflow:hidden;';
document.body.appendChild(pContainer);
const cols = ['#ff6600','#ff3300','#ffaa00','#cc00ff','#00ccff','#ff0088'];
for(let i=0;i<80;i++){
  const p = document.createElement('div');
  const s = Math.random()*5+2;
  p.style.cssText = `position:absolute;border-radius:50%;animation:floatUp linear infinite;opacity:0;width:${s}px;height:${s}px;background:${cols[Math.floor(Math.random()*cols.length)]};left:${Math.random()*100}%;animation-duration:${Math.random()*18+10}s;animation-delay:${Math.random()*12}s;`;
  pContainer.appendChild(p);
}

// 5. Логика переключения вкладок
const sections = { roulette: 'casinoSectionRoulette', slots: 'casinoSectionSlots', crash: 'casinoSectionCrash', blackjack: 'casinoSectionBlackjack', mines: 'casinoSectionMines' };
const tabs = document.querySelectorAll('.casino-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => { t.classList.remove('active'); t.querySelector('img').style.filter = ''; t.querySelector('img').style.opacity = '0.55'; });
    tab.classList.add('active');
    tab.querySelector('img').style.filter = 'brightness(1.2) drop-shadow(0 0 6px #ffaa00)';
    tab.querySelector('img').style.opacity = '1';
    Object.values(sections).forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById(sections[tab.dataset.tab]).style.display = 'block';
    if(tab.dataset.tab === 'crash' && window.casinoResizeCrash) window.casinoResizeCrash();
  });
});
tabs[0].querySelector('img').style.filter = 'brightness(1.2) drop-shadow(0 0 6px #ffaa00)';
tabs[0].querySelector('img').style.opacity = '1';

// 6. Глобальные функции
window.casinoSetSlotBet = (v) => { document.getElementById('casinoSlotBet').value = v; };
window.casinoSetCrashBet = (v) => { document.getElementById('casinoCrashBetInput').value = v; };
window.casinoSetBjBet = (v) => { document.getElementById('casinoBjBet').value = v; };
window.casinoSetMinesBet = (v) => { document.getElementById('casinoMinesBet').value = v; };
window.casinoCloseJackpot = () => { document.getElementById('casinoJackpotOverlay').style.display = 'none'; };
window.casinoClaimDailyImpulse = async () => {
  try {
    const r = await authFetch(`${BASE_URL}/api/impulse/daily`, { method: 'POST' });
    const d = await r.json();
    if(d.received) {
      const balEl = document.getElementById('casinoBalanceAmount');
      if(balEl) balEl.textContent = (parseInt(balEl.textContent.replace(/\D/g,'')) + d.received).toLocaleString();
      casinoShowToast(`+${d.received} IMPULSE!`, 3000);
      const btnImg = document.getElementById('casinoDailyImpulseBtnImg');
      if(btnImg) { btnImg.style.filter='grayscale(1)'; btnImg.style.opacity='0.4'; }
    } else if(d.error) {
      casinoShowToast(d.error, 3000);
    }
  } catch(e) { casinoShowToast('Ошибка', 3000); }
};

// Синхронизация мин
const mRange = document.getElementById('casinoMinesRange');
const mInput = document.getElementById('casinoMinesCount');
mRange.addEventListener('input', () => { mInput.value = mRange.value; });
mInput.addEventListener('input', () => { mRange.value = Math.max(1, Math.min(24, parseInt(mInput.value)||1)); });

// 7. Загрузка баланса
async function loadCasinoBalance() {
  try {
    const r = await authFetch(`${BASE_URL}/api/impulse/balance`);
    const d = await r.json();
    balance = d.balance || 0;
    const balEl = document.getElementById('casinoBalanceAmount');
    if(balEl) balEl.textContent = balance.toLocaleString();
  } catch(e) {}
}
loadCasinoBalance();

// Утилита для уведомлений
function casinoShowToast(msg, dur = 3000) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, dur);
}
  window.casinoShowToast = casinoShowToast;
  window.casinoGetBalance = () => balance;
  window.casinoSetBalance = (v) => { balance = v; };
  window.casinoCt = ct;
  if (window.initCasinoMines) window.initCasinoMines();
  if (window.initCasinoFortuna) window.initCasinoFortuna();
  if (window.initCasinoSpark) window.initCasinoSpark();
  if (window.initCasinoXxi) window.initCasinoXxi();
  if (window.initCasinoKrash) window.initCasinoKrash();

  // Кнопка назад
  document.getElementById('casinoBackBtn').addEventListener('click', () => {
    casinoContainer.remove();
    pContainer.remove();
    switchTab('game');
  });
}
// ==================== КОНЕЦ КАЗИНО ====================
