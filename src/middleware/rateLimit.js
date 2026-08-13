const requestLog = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of requestLog) {
    if (now > val.resetAt) requestLog.delete(key);
  }
}, 60000);

function rateLimit(maxReq, windowMs) {
  return (req, res, next) => {
    const userId = req.tgUser?.id;
    const key = userId ? `${userId}:${req.path}` : `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = requestLog.get(key);
    if (!entry || now > entry.resetAt) {
      requestLog.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= maxReq) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    entry.count++;
    next();
  };
}

const publicRateLimit = rateLimit(30, 60000);
const authRateLimit = rateLimit(20, 60000);
const heavyRateLimit = rateLimit(10, 60000);
const casinoRateLimit = rateLimit(15, 60000);
const adminRateLimit = rateLimit(60, 60000);
const questionsAdminRateLimit = rateLimit(120, 60000);

module.exports = {
  publicRateLimit,
  authRateLimit,
  heavyRateLimit,
  casinoRateLimit,
  adminRateLimit,
  questionsAdminRateLimit,
};
