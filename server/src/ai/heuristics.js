
const SENSATIONAL = ['breaking', 'shocking', 'miracle', 'secret', 'aliens', '100%', 'exposed', "they don't want you",
  'share before', 'cure', 'hoax', 'banned', 'you won\'t believe', 'urgent', 'forward this'];

function signals(text) {
  const lower = text.toLowerCase();
  const flags = SENSATIONAL.filter((w) => lower.includes(w)).map((w) => `Sensational wording: "${w}"`);
  const letters = text.replace(/[^A-Za-z]/g, '');
  const caps = letters.length > 20 ? letters.replace(/[^A-Z]/g, '').length / letters.length : 0;
  if (caps > 0.5) flags.push('Mostly capital letters');
  if (/!{2,}/.test(text)) flags.push('Repeated exclamation marks');
  return flags;
}

exports.wordingCheck = (text) => {
  const redFlags = signals(text);
  return {
    verdict: 'UNCERTAIN',
    reliabilityScore: Math.max(20, 60 - redFlags.length * 12),
    confidence: 25,
    sentiment: 'NEUTRAL',
    subjectivity: Math.min(100, 20 + redFlags.length * 15),
    explanation: 'The AI fact-checker is temporarily unavailable, so this is only a basic wording check. It cannot tell you whether the claim is true.',
    redFlags,
  };
};

// MOCK_LLM=true 
exports.mockAnalysis = (text) => {
  const redFlags = signals(text);
  const verdict = redFlags.length >= 2 ? 'FAKE' : redFlags.length === 1 ? 'UNCERTAIN' : 'REAL';
  return {
    verdict,
    reliabilityScore: verdict === 'FAKE' ? 15 : verdict === 'UNCERTAIN' ? 45 : 78,
    confidence: 60,
    sentiment: 'NEUTRAL',
    subjectivity: 30,
    explanation: `Mock mode: ${redFlags.length ? 'sensational wording detected' : 'no obvious red flags'}.`,
    redFlags,
    model: 'mock',
    truth: verdict === 'REAL' ? null : { summary: 'Mock mode: no live fact-check was performed.', facts: [], sources: [], grounded: false, model: 'mock' },
    degraded: false,
  };
};