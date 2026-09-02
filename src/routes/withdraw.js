const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireInitDataStrict } = require('../middleware/auth');
const { heavyRateLimit } = require('../middleware/rateLimit');
const { MIN_WITHDRAW } = require('../config');
const { sendCogniqJetton } = require('../services/ton');

function isValidTonAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const clean = address.trim();
  
  // Friendly format: EQ/UQ + 46 символов = 48 total
  if (/^[EUk][Qq0-9A-Za-z_-]{47}$/.test(clean)) return true;
  
  // Raw format: 0:hex (64 hex chars after colon)
  if (/^[0-9a-fA-F]:[0-9a-fA-F]{64}$/.test(clean)) return true;
  
  // Raw format без workchain: 64 hex chars
  if (/^[0-9a-fA-F]{64}$/.test(clean)) return true;
  
  return false;
}

async function checkAml(wallet) {
  try {
    const amlRes = await fetch(`https://tonapi.io/v2/accounts/${encodeURIComponent(wallet)}`);
    if (!amlRes.ok) return 'unknown';
    const amlData = await amlRes.json();
    return amlData.is_scam ? 'scam' : 'clean';
  } catch (e) {
    console.error('[AML] auto-check error:', e.message);
    return 'unknown';
  }
}

router.post('/api/withdraw', requireInitDataStrict, heavyRateLimit, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = req.tgUser.id;
    const { amount, wallet } = req.body;

    if (!Number.isInteger(amount) || amount <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    const userRes = await client.query('SELECT * FROM users WHERE telegram_id = $1 FOR UPDATE', [userId]);
    const user = userRes.rows[0];
    if (!user) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const lang = user.language_code || 'en';

    const withdrawTickets = user.withdraw_tickets || 0;
    if (withdrawTickets < 1) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: ({ ru: 'У вас нет доступных выводов. Сыграйте супер-игру, чтобы получить право на вывод 1000 COGNIQ.', en: 'No withdrawals available. Play a super game to unlock a withdrawal of 1000 COGNIQ.', fr: 'Aucun retrait disponible. Jouez une super partie pour débloquer un retrait de 1000 COGNIQ.', es: 'No hay retiros disponibles. Juega un super juego para desbloquear un retiro de 1000 COGNIQ.' })[lang] || 'No withdrawals available.'});
    }
    if (user.balance < MIN_WITHDRAW) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: ({ ru: `Минимум ${MIN_WITHDRAW} COGNIQ для вывода`, en: `Minimum ${MIN_WITHDRAW} COGNIQ to withdraw`, fr: `Minimum ${MIN_WITHDRAW} COGNIQ pour retirer`, es: `Mínimo ${MIN_WITHDRAW} COGNIQ para retirar` })[lang] || `Minimum ${MIN_WITHDRAW} COGNIQ to withdraw`});
    }
    if (amount > user.balance) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: ({ ru: 'Недостаточно COGNIQ', en: 'Insufficient COGNIQ', fr: 'COGNIQ insuffisant', es: 'COGNIQ insuficiente' })[lang] || 'Insufficient COGNIQ'});
    }
    if (!wallet || !isValidTonAddress(wallet)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: ({ ru: 'Некорректный адрес кошелька', en: 'Invalid wallet address', fr: 'Adresse de portefeuille invalide', es: 'Dirección de billetera inválida' })[lang] || 'Invalid wallet address'});
    }

    const withdrawAmount = Math.min(amount, user.balance);
    const ticketsToSpend = Math.min(withdrawTickets, Math.floor(withdrawAmount / MIN_WITHDRAW));
    if (ticketsToSpend === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: ({ ru: 'Недостаточно квитанций для вывода этой суммы. 1 квитанция = 1000 COGNIQ.', en: 'Not enough withdrawal tickets for this amount. 1 ticket = 1000 COGNIQ.', fr: 'Pas assez de tickets de retrait pour ce montant. 1 ticket = 1000 COGNIQ.', es: 'No hay suficientes tickets de retiro para este monto. 1 ticket = 1000 COGNIQ.' })[lang] || 'Not enough withdrawal tickets.'});
    }

    const newBalance = user.balance - (ticketsToSpend * MIN_WITHDRAW);
    const newTickets = withdrawTickets - ticketsToSpend;

    const amlStatus = await checkAml(wallet);
    console.log(`[AML] withdraw request from ${userId}: ${wallet.slice(0, 10)}... → ${amlStatus}`);

    await client.query(
      `INSERT INTO withdrawals (telegram_id, amount, wallet, status, created_at, aml_status)
       VALUES ($1, $2, $3, 'pending', NOW(), $4)`,
      [userId, ticketsToSpend * MIN_WITHDRAW, wallet, amlStatus]
    );
    await client.query(
      `UPDATE users SET balance = $1, withdraw_tickets = $2 WHERE telegram_id = $3`,
      [newBalance, newTickets, userId]
    );
    await client.query('COMMIT');

    res.json({ success: true, message: ({ ru: `Заявка на вывод ${ticketsToSpend * MIN_WITHDRAW} COGNIQ принята`, en: `Withdrawal request for ${ticketsToSpend * MIN_WITHDRAW} COGNIQ submitted`, fr: `Demande de retrait de ${ticketsToSpend * MIN_WITHDRAW} COGNIQ soumise`, es: `Solicitud de retiro de ${ticketsToSpend * MIN_WITHDRAW} COGNIQ enviada` })[lang] || `Withdrawal of ${ticketsToSpend * MIN_WITHDRAW} COGNIQ submitted`});
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  } finally {
    client.release();
  }
});

module.exports = router;
