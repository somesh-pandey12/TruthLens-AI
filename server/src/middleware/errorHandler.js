const env = require('../config/env');
const ApiError = require('../utils/ApiError');

exports.notFound = (req, res) =>
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });

exports.errorHandler = (err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ message: 'Email already registered' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });

  const status = err.status || 500;
  const expected = err instanceof ApiError;
  if (!expected && status >= 500) console.error(err);

  const message = !expected && status >= 500 && env.isProd ? 'Something went wrong' : err.message;
  const body = { message, ...(err.extra || {}) };
  if (err.extra?.retryAfter) res.set('Retry-After', String(err.extra.retryAfter));
  res.status(status).json(body);
};