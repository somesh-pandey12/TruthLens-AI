const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { HttpError } = require('../utils/helpers');

const readToken = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};

exports.requireAuth = (req, res, next) => {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Please sign in to continue'));
  try {
    req.user = { id: jwt.verify(token, env.jwtSecret).id };
    next();
  } catch {
    next(new HttpError(401, 'Session expired. Please sign in again'));
  }
};

exports.optionalAuth = (req, res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = { id: jwt.verify(token, env.jwtSecret).id };
    } catch {
      /* ignore */
    }
  }
  next();
};