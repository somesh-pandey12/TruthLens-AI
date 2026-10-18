const mongoose = require('mongoose');
const analyzer = require('../ai/analyzer');

const DB_STATES = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
let cache = { at: 0, data: null };
exports.status = async (req, res) => {
  if (cache.data && Date.now() - cache.at < 20000) return res.status(cache.data.ok ? 200 : 503).json(cache.data);

  const ai = await analyzer.status();
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown';
  const hints = [...ai.hints];
  if (db !== 'connected') hints.push('MongoDB is not connected: check MONGO_URI and that Atlas Network Access allows 0.0.0.0/0.');

  const ok = db === 'connected' && ai.configured && ai.reachable && ai.assessModels.length > 0;
  const data = { ok, time: new Date().toISOString(), db, ai, hints };
  cache = { at: Date.now(), data };
  res.status(ok ? 200 : 503).json(data);
};