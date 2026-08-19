const crypto = require('crypto');

function bjBuildDeck() {
  const SUITS = ['♠','♥','♦','♣'];
  const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  let deck = [];
  for (let d = 0; d < 6; d++) {
    for (const s of SUITS) {
      for (const v of VALUES) {
        deck.push({ v, s });
      }
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const buf = crypto.randomBytes(4);
    const j = buf.readUInt32BE(0) % (i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function bjCardValue(card) {
  if (['J','Q','K'].includes(card.v)) return 10;
  if (card.v === 'A') return 11;
  return parseInt(card.v);
}

function bjHandScore(hand) {
  let score = 0, aces = 0;
  for (const c of hand) {
    score += bjCardValue(c);
    if (c.v === 'A') aces++;
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function minesMultiplier(total, mines, opened) {
  if (opened === 0) return 1.00;
  let mult = 1.0;
  for (let i = 0; i < opened; i++) {
    const safe = total - mines - i;
    const remaining = total - i;
    mult *= remaining / safe;
  }
  return Math.floor(mult * 0.95 * 100) / 100;
}

function generateCrashPoint() {
  const r = crypto.randomBytes(4).readUInt32BE(0) / 0x100000000;
  const houseEdge = 0.04; // 4% — край казино на ЛЮБОМ множителе
  if (r < houseEdge) return 1.00;
  // Формула честного краша: (1 - houseEdge) / (1 - r)
  const crash = Math.floor(((1 - houseEdge) / (1 - r)) * 100) / 100;
  return Math.min(crash, 100.00);
}

/** Множитель только на сервере. Та же формула должна быть на фронте для анимации. */
function crashMultiplierAt(elapsedMs) {
  const t = Math.max(0, elapsedMs) / 1000;
  const mult = Math.pow(1.06, t * 8);
  return Math.min(Math.floor(mult * 100) / 100, 100);
}

module.exports = {
  bjBuildDeck,
  bjCardValue,
  bjHandScore,
  minesMultiplier,
  generateCrashPoint,
  crashMultiplierAt,
};
