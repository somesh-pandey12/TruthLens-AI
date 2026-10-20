const rateLimit = require('express-rate-limit');

const make = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { message } });

exports.globalLimiter = make(15 * 60 * 1000, 300, 'Too many requests. Please slow down.');
exports.authLimiter = make(15 * 60 * 1000, 30, 'Too many login attempts. Try again in 15 minutes.');
exports.analyzeLimiter = make(60 * 1000, 8, 'Too many analyses. Please wait a minute.');