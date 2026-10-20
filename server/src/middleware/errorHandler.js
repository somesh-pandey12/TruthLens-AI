const env = require('../config/env');

exports.notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

exports.errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  if (!err.expected) console.error('[error]', err);
  const message = status >= 500 && env.isProd && !err.expected ? 'Something went wrong' : err.message;
  res.status(status).json({ message });
};