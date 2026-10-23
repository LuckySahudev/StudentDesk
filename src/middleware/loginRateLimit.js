const attemptsByIp = new Map();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;

function loginRateLimit(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  let record = attemptsByIp.get(ip);

  if (!record || now >= record.resetAt) {
    record = { count: 0, resetAt: now + windowMs };
    attemptsByIp.set(ip, record);
  }

  if (record.count >= maxAttempts) {
    res.set('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  }

  record.count += 1;
  if (attemptsByIp.size > 10000) {
    for (const [key, value] of attemptsByIp) {
      if (now >= value.resetAt) attemptsByIp.delete(key);
    }
  }
  next();
}

module.exports = loginRateLimit;
