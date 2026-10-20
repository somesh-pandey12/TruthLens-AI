const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const analyzer = require('../services/analyzer.service');
const env = require('../config/env');
const { HttpError } = require('../utils/helpers');

exports.analyze = async (req, res) => {
  const text = String(req.body.text || '').trim();
  const url = String(req.body.url || '').trim();

  if (text.length > 5000) throw new HttpError(400, 'Text is too long (max 5000 characters)');
  if (!text && !url) throw new HttpError(400, 'Paste a claim or add a news link');
  if (url && !/^https?:\/\/[^\s]+\.[^\s]+$/i.test(url)) throw new HttpError(400, 'Please enter a valid link starting with http:// or https://');

  const result = await analyzer.analyze({ text, url });

  let saved = false;
  if (req.user) {
    try {
      await Analysis.create({ user: req.user.id, inputText: text, sourceUrl: url, ...result });
      saved = true;
    } catch (e) {
      console.warn('[history] save skipped:', e.message);
    }
  }
  res.json({ ...result, saved });
};

exports.history = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 10;
  const filter = { user: req.user.id };
  const [items, total] = await Promise.all([
    Analysis.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Analysis.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
};

exports.remove = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid id');
  const r = await Analysis.deleteOne({ _id: req.params.id, user: req.user.id });
  if (!r.deletedCount) throw new HttpError(404, 'Not found');
  res.json({ ok: true });
};

exports.status = (req, res) => {
  const db = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
  res.json({
    db,
    groqKey: Boolean(env.groqKey),
    tavilyKey: Boolean(env.tavilyKey),
    model: env.groqModel,
    allowedOrigins: env.clientUrls,
  });
};