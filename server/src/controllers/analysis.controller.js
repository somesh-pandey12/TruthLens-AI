const { z } = require('zod');
const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const mlService = require('../services/ml.service');
const ApiError = require('../utils/ApiError');

const VERDICTS = ['REAL', 'FAKE', 'UNCERTAIN'];

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
        truth: result.truth || null,
      });
      saved = true;
    } catch (e) {
      console.warn('History save skipped:', e.message);
    }
  }
  res.json({ ...result, saved });
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.history = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const filter = { user: req.user.id };
  if (VERDICTS.includes(req.query.verdict)) filter.verdict = req.query.verdict;
  const q = String(req.query.q || '').trim().slice(0, 100);
  if (q) filter.inputText = { $regex: escapeRegex(q), $options: 'i' };

  const [items, total] = await Promise.all([
    Analysis.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-__v').lean(),
    Analysis.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) || 1 });
};

function safeTimeZone(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

exports.stats = async (req, res) => {
  const uid = new mongoose.Types.ObjectId(req.user.id);
  const tz = safeTimeZone(String(req.query.tz || 'UTC'));
  const DAYS = 14;
  const since = new Date(Date.now() - (DAYS + 1) * 86400000);

  const [byVerdict, dailyRows, recent] = await Promise.all([
    Analysis.aggregate([
      { $match: { user: uid } },
      { $group: { _id: '$verdict', count: { $sum: 1 }, avg: { $avg: '$reliabilityScore' } } },
    ]),
    Analysis.aggregate([
      { $match: { user: uid, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } }, count: { $sum: 1 } } },
    ]),
    Analysis.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(5).select('-__v').lean(),
  ]);

  const out = { total: 0, REAL: 0, FAKE: 0, UNCERTAIN: 0, avgScore: 0 };
  let weighted = 0;
  byVerdict.forEach((r) => {
    out[r._id] = r.count;
    out.total += r.count;
    weighted += (r.avg || 0) * r.count;
  });
  out.avgScore = out.total ? Math.round(weighted / out.total) : 0;

  const counts = Object.fromEntries(dailyRows.map((r) => [r._id, r.count]));
  out.daily = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(Date.now() - (DAYS - 1 - i) * 86400000).toLocaleDateString('en-CA', { timeZone: tz });
    return { date, count: counts[date] || 0 };
  });
  out.recent = recent;
  res.json(out);
};

const csvCell = (v) => {
  let s = String(v ?? '').replace(/\r?\n/g, ' ');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

exports.exportCsv = async (req, res) => {
  const items = await Analysis.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(2000).lean();
  const header = ['Date', 'Verdict', 'Reliability score', 'Confidence', 'Sentiment', 'Content', 'Explanation', 'Red flags', 'Fact-check summary'];
  const rows = items.map((a) => [
    new Date(a.createdAt).toISOString(),
    a.verdict,
    a.reliabilityScore,
    a.confidence,
    a.sentiment,
    a.inputText,
    a.explanation,
    (a.redFlags || []).join('; '),
    a.truth?.summary || '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="truthlens-history.csv"');
  res.send('\ufeff' + csv);
};

exports.remove = async (req, res) => {
  const doc = await Analysis.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!doc) throw new ApiError(404, 'Analysis not found');
  res.json({ message: 'Deleted' });
};