const mlService = require('../services/ml.service');

exports.warmup = (req, res) => {
  mlService.warm();
  res.status(202).json({ status: 'warming' });
};

let cache = { at: 0, data: null };
exports.mlStatus = async (req, res) => {
  if (cache.data && Date.now() - cache.at < 10000) return res.status(cache.data.ok ? 200 : 503).json(cache.data);
  const data = await mlService.diagnose();
  cache = { at: Date.now(), data };
  res.status(data.ok ? 200 : 503).json(data);
};