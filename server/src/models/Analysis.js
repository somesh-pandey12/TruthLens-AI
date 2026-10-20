const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema(
  { title: String, url: String, domain: String, stance: String },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inputText: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
    claim: String,
    verdict: { type: String, enum: ['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIED'], required: true },
    score: Number,
    confidence: Number,
    summary: String,
    tone: String,
    redFlags: [String],
    sources: [sourceSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analysis', analysisSchema);