const env = require('../config/env');

exports.notFound = (req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  const body = { message: status >= 500 && env.isProd ? 'Something went wrong' : err.message, ...(err.extra || {}) };
  if (err.extra?.retryAfter) res.set('Retry-After', String(err.extra.retryAfter));
  res.status(status).json(body);
};