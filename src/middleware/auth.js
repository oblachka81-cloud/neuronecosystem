const crypto = require('crypto');
const config = require('../config');

function verifyInitData(initData, maxAge = 86400) {
  if (!initData) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    const authDate = parseInt(params.get('auth_date') || '0');
    const now = Date.now() / 1000;
    if (now - authDate > maxAge) return null;
    if (authDate - now > 300) return null;

    params.delete('hash');
    const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = sorted.map(([k, v]) => `${k}=${v}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(config.BOT_TOKEN).digest();
    const expectedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString).digest('hex');
    if (expectedHash !== hash) return null;
    const userParam = params.get('user');
    return userParam ? JSON.parse(userParam) : null;
  } catch {
    return null;
  }
}

function requireInitData(req, res, next) {
  const initData = req.headers['x-telegram-init-data'] || req.headers['x-init-data'];
  const user = verifyInitData(initData);

  if (user) {
    req.tgUser = user;
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

function requireInitDataStrict(req, res, next) {
  const initData = req.headers['x-telegram-init-data'] || req.headers['x-init-data'];
  const user = verifyInitData(initData, 3600); // 1 час

  if (user) {
    req.tgUser = user;
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-password'] !== config.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

module.exports = {
  verifyInitData,
  requireInitData,
  requireInitDataStrict,
  requireAdmin,
};
