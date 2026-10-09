const { z } = require('zod');
const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const mlService = require('../services/ml.service');
const ApiError = require('../utils/ApiError');

exports.analyzeSchema = z.object({
  text: z.string().trim().min(20, 'Please enter at least 20 characters').max(5000, 'Text is too long (max 5000 chars)'),
  url: z.string().trim().max(500).optional().default(''),
});

exports.analyze = async (req, res) => {
  const { text, url } = req.body;
  const result = await mlService.analyze(text, url);

  let saved = false;
  if (req.user) {
    try {
      await Analysis.create({
        user: req.user.id,
        inputText: text,
        sourceUrl: url,
        verdict: result.verdict,
        reliabilityScore: result.reliabilityScore,
        confidence: result.confidence,
        sentiment: result.sentiment,
        subjectivity: result.subjectivity,
        explanation: result.explanation,
        redFlags: result.redFlags,
      });
      saved = true;
    } catch (e) {
      console.warn('History save skipped:', e.message);
    }
  }
  res.json({ ...result, saved });
};

exports.history = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const filter = { user: req.user.id };
  if (['REAL', 'FAKE', 'UNCERTAIN'].includes(req.query.verdict)) filter.verdict = req.query.verdict;

  const [items, total] = await Promise.all([
    Analysis.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-__v').lean(),
    Analysis.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};

exports.stats = async (req, res) => {
  const rows = await Analysis.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
    { $group: { _id: '$verdict', count: { $sum: 1 }, avg: { $avg: '$reliabilityScore' } } },
  ]);
  const out = { total: 0, REAL: 0, FAKE: 0, UNCERTAIN: 0, avgScore: 0 };
  let weighted = 0;
  rows.forEach((r) => {
    out[r._id] = r.count;
    out.total += r.count;
    weighted += (r.avg || 0) * r.count;
  });
  out.avgScore = out.total ? Math.round(weighted / out.total) : 0;
  res.json(out);
};

exports.remove = async (req, res) => {
  const doc = await Analysis.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!doc) throw new ApiError(404, 'Analysis not found');
  res.json({ message: 'Deleted' });
};