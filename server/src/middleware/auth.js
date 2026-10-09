const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

exports.requireAuth = (req, res, next) => {
  const token = readToken(req);
  if (!token) return next(new ApiError(401, 'Authentication required'));
  try {
    req.user = { id: jwt.verify(token, env.jwtSecret).id };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

exports.optionalAuth = (req, res, next) => {
  const token = readToken(req);
  if (token) {
    try {
      req.user = { id: jwt.verify(token, env.jwtSecret).id };
    } catch {
    }
  }
  next();
};