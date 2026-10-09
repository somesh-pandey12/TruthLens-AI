const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inputText: { type: String, required: true },
    sourceUrl: { type: String, default: '' },
    verdict: { type: String, enum: ['REAL', 'FAKE', 'UNCERTAIN'], default: 'UNCERTAIN' },
    reliabilityScore: { type: Number, min: 0, max: 100 },
    confidence: { type: Number, min: 0, max: 100 },
    sentiment: { type: String, default: 'NEUTRAL' },
    subjectivity: { type: Number },
    explanation: { type: String, default: '' },
    redFlags: { type: [String], default: [] },
  },
  { timestamps: true }
);

analysisSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);