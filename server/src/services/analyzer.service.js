const tavily = require('./tavily.service');
const groq = require('./groq.service');
const { HttpError } = require('../utils/helpers');

const VERDICTS = ['TRUE', 'FALSE', 'MISLEADING', 'UNVERIFIED'];
const STANCES = ['supports', 'contradicts', 'neutral'];

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
function slugWords(url) {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
    const words = last.replace(/\.[a-z]{2,5}$/i, '').replace(/-?\d{4,}$/, '').split(/[-_]/).filter(Boolean);
    return words.length >= 3 ? words.join(' ') : '';
  } catch {
    return '';
  }
}

const isGeneric = (t) => t.trim().length < 30;

function buildQueries({ text, url, article }) {
  const queries = [];
  const slug = url ? slugWords(url) : '';
  if (slug) queries.push(slug);
  if (text && !isGeneric(text)) queries.push(text.replace(/\s+/g, ' ').slice(0, 300));
  if (!queries.length && article?.content) queries.push(article.content.replace(/\s+/g, ' ').slice(0, 250));
  return [...new Set(queries)].slice(0, 2);
}

const SYSTEM = (today) => `You are TruthLens, a careful and honest fact-checking analyst. Today's date is ${today}.

You receive: (1) the user's submission (a claim, headline or post, possibly just a link), (2) optional text of the linked article, and (3) WEB EVIDENCE retrieved moments ago, numbered [1], [2], ...

Rules:
- Judge ONLY from the evidence given. Do not rely on memory for recent events. If the evidence does not cover the claim, the verdict is UNVERIFIED.
- If the user's text is only a generic question (like "is this true?"), the claim to check is the linked article's headline/main event.
- Several independent, reputable outlets reporting the same event = strong support. Results from the same website as the submitted link only prove the article exists; they are not independent confirmation.
- Evidence that directly contradicts the claim -> FALSE. Partly true, missing context, exaggerated or outdated -> MISLEADING. Well supported -> TRUE. Not enough evidence -> UNVERIFIED.
- Never invent sources. Refer to evidence only by its number.
- "score" is how credible the claim is: 0 = certainly false, 100 = certainly true. Keep UNVERIFIED scores between 35 and 65.
- "confidence" is how sure you are of your verdict (0-100). Low evidence = low confidence.
- Write in simple, clear English.

Reply with ONLY this JSON:
{
  "verdict": "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED",
  "score": 0-100,
  "confidence": 0-100,
  "claim": "one-line restatement of the claim you checked",
  "summary": "2-4 sentences explaining the verdict and what the evidence shows",
  "tone": "neutral" | "emotional" | "sensational" | "promotional",
  "redFlags": ["short red flags in the content itself, max 4, empty if none"],
  "sources": [ { "index": 1, "stance": "supports" | "contradicts" | "neutral" } ]
}`;

function buildUserPrompt({ text, url, article, evidence }) {
  const parts = [`USER SUBMISSION:\n${text || '(no text, only a link)'}`];
  if (url) parts.push(`SUBMITTED LINK: ${url}`);
  if (article) parts.push(`LINKED ARTICLE TEXT (may be truncated):\n${article.content.slice(0, 2500)}`);
  parts.push(
    evidence.length
      ? 'WEB EVIDENCE:\n' +
          evidence.map((e, i) => `[${i + 1}] ${e.title} (${e.domain})\n${e.content}`).join('\n\n')
      : 'WEB EVIDENCE: none found.'
  );
  return parts.join('\n\n');
}

exports.analyze = async ({ text = '', url = '' }) => {
  let article = null;
  if (url) {
    try {
      article = await tavily.extract(url);
    } catch (e) {
      console.warn('[analyzer] extract failed:', e.message);
    }
  }
  const queries = buildQueries({ text, url, article });
  if (!queries.length) {
    throw new HttpError(400, 'Please paste the claim or headline (at least a sentence), or add a news link.');
  }
  const settled = await Promise.allSettled(queries.map((q) => tavily.search(q)));
  const seen = new Set();
  const evidence = [];
  settled.forEach((r) => {
    if (r.status === 'rejected') return console.warn('[analyzer] search failed:', r.reason.message);
    r.value.forEach((e) => {
      if (e.url && !seen.has(e.url)) {
        seen.add(e.url);
        evidence.push(e);
      }
    });
  });
  const searchFailed = settled.every((r) => r.status === 'rejected');
  const evidenceList = evidence.slice(0, 8);

  const ai = await groq.chatJson(
    SYSTEM(new Date().toISOString().slice(0, 10)),
    buildUserPrompt({ text, url, article, evidence: evidenceList })
  );

  let verdict = VERDICTS.includes(String(ai.verdict).toUpperCase()) ? String(ai.verdict).toUpperCase() : 'UNVERIFIED';
  let score = clamp(ai.score, 0, 100);
  let confidence = clamp(ai.confidence, 0, 100);

  if (!evidenceList.length) {
    verdict = 'UNVERIFIED';
    confidence = Math.min(confidence, 30);
    score = Math.min(65, Math.max(35, score));
  }
  if (verdict === 'UNVERIFIED') score = Math.min(65, Math.max(35, score));

  const stanceByIndex = new Map(
    (Array.isArray(ai.sources) ? ai.sources : []).map((s) => [Number(s.index), STANCES.includes(s.stance) ? s.stance : 'neutral'])
  );
  const sources = evidenceList.map((e, i) => ({
    title: e.title || e.domain,
    url: e.url,
    domain: e.domain,
    stance: stanceByIndex.get(i + 1) || 'neutral',
  }));

  const redFlags = (Array.isArray(ai.redFlags) ? ai.redFlags : []).map(String).filter(Boolean).slice(0, 4);
  if (searchFailed) redFlags.push('Live web search was unavailable, so this result is limited');

  return {
    verdict,
    score,
    confidence,
    claim: String(ai.claim || '').slice(0, 300),
    summary: String(ai.summary || 'No summary available.').slice(0, 1200),
    tone: ['neutral', 'emotional', 'sensational', 'promotional'].includes(ai.tone) ? ai.tone : 'neutral',
    redFlags,
    sources,
    usedArticle: Boolean(article),
    searchedAt: new Date().toISOString(),
  };
};