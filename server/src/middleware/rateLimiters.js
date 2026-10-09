const rateLimit = require('express-rate-limit');

const make = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ message, retryAfter: Math.ceil(windowMs / 1000) }),
  });

exports.globalLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please slow down.');
exports.authLimiter = make(15 * 60 * 1000, 20, 'Too many login attempts. Try again in 15 minutes.');
exports.analyzeLimiter = make(60 * 1000, 8, 'Too many analyses. Please wait a minute.');