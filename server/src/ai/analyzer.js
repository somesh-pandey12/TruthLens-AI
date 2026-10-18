const crypto = require('crypto');
const cfg = require('./config');
const groq = require('./groq');
const models = require('./models');
const P = require('./prompts');
const { wordingCheck, mockAnalysis } = require('./heuristics');
const TTLCache = require('../utils/ttlCache');

const cache = new TTLCache(300, cfg.cacheTtlMs);
let lastError = null; 

function noteError(where, e) {
  lastError = { at: new Date().toISOString(), where, status: e.status ?? null, message: String(e.message).slice(0, 200) };
  console.error(`[ai] ${where} failed (status ${e.status ?? '-'}): ${e.message}`);
}

const isSearchModel = (m) => m.startsWith('groq/compound');
const isReasoningModel = (m) => m.includes('gpt-oss');

// ----------------------------------------------------------------------------- helpers
function extractJson(raw) {
  let s = String(raw || '').trim().replace(/^```(?:json)?|```$/gim, '').trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new groq.GroqError('Model did not return JSON', { status: 502 });
  return JSON.parse(m[0]);
}

const clamp = (v, d = 50) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : d;
};

function normalise(r) {
  const verdict = String(r.verdict || 'UNCERTAIN').toUpperCase();
  const sentiment = String(r.sentiment || 'NEUTRAL').toUpperCase();
  return {
    verdict: ['REAL', 'FAKE', 'UNCERTAIN'].includes(verdict) ? verdict : 'UNCERTAIN',
    reliabilityScore: clamp(r.reliabilityScore),
    confidence: clamp(r.confidence),
    sentiment: ['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(sentiment) ? sentiment : 'NEUTRAL',
    subjectivity: clamp(r.subjectivity, 40),
    explanation: String(r.explanation || '').slice(0, 500),
    redFlags: Array.isArray(r.redFlags) ? r.redFlags.map((f) => String(f).slice(0, 120)).slice(0, 6) : [],
  };
}

async function chat(model, system, user, { temperature = 0.2, maxTokens = cfg.maxTokens, json = true, timeoutMs } = {}) {
  const base = { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature };
  const profiles = [
    {
      ...base,
      max_completion_tokens: maxTokens,
      ...(isReasoningModel(model) && { reasoning_effort: cfg.reasoningEffort }),
      ...(json && !isSearchModel(model) && { response_format: { type: 'json_object' } }),
    },
    { ...base, max_completion_tokens: maxTokens },
    { ...base, max_tokens: maxTokens },
  ];
  let lastErr;
  for (const payload of profiles) {
    try {
      const res = await groq.chat(payload, timeoutMs);
      const message = res?.choices?.[0]?.message;
      if (!message) throw new groq.GroqError('Empty response from Groq', { status: 502 });
      return message;
    } catch (e) {
      lastErr = e;
      if (e.status !== 400) throw e;
    }
  }
  throw lastErr;
}

async function runChain(list, attempt, budgetMs) {
  const started = Date.now();
  let lastErr = null;
  for (const model of list) {
    const left = budgetMs - (Date.now() - started);
    if (left <= 0) break;
    try {
      return { value: await attempt(model, Math.max(500, Math.min(cfg.timeoutMs, left))), model };
    } catch (e) {
      lastErr = e;
      noteError(model, e);
      if (e.status === 404) models.invalidate(); 
      if (e.status === 401 || e.status === 403) break; 
    }
  }
  throw lastErr || new groq.GroqError('No AI model available', { status: 503 });
}

// credibility check
async function assess(text, url) {
  const list = await models.resolve(cfg.assessModels);
  const { value, model } = await runChain(list, async (m, timeoutMs) => {
    const msg = await chat(m, P.SYSTEM, P.assessPrompt(text, url), { timeoutMs });
    return normalise(extractJson(msg.content));
  }, cfg.assessBudgetMs);
  return { ...value, model };
}

// fact-check 
const get = (o, k) => (o == null ? undefined : o[k]);

function cleanSources(items, limit = 5) {
  const out = [];
  const seen = new Set();
  for (const item of items || []) {
    const url = String(get(item, 'url') || '').trim();
    if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    out.push({ title: String(get(item, 'title') || url).trim().slice(0, 140), url: url.slice(0, 500) });
    if (out.length >= limit) break;
  }
  return out;
}

function searchSources(message) {
  const found = [];
  for (const tool of message?.executed_tools || []) {
    for (const r of tool?.search_results?.results || []) found.push({ title: r.title, url: r.url });
  }
  return found;
}

async function factCheck(text, assessment) {
  try {
    const list = await models.resolve(cfg.factModels);
    const { value } = await runChain(list, async (m, timeoutMs) => {
      const msg = await chat(m, P.FACT_SYSTEM, P.factPrompt(text, assessment), { temperature: 0.1, maxTokens: 1500, timeoutMs });
      const data = extractJson(msg.content);
      const searched = isSearchModel(m);
      const sources = searched ? cleanSources(searchSources(msg)) : [];
      return {
        summary: String(data.summary || '').slice(0, 900),
        facts: Array.isArray(data.facts) ? data.facts.map((f) => String(f).slice(0, 300)).slice(0, 4) : [],
        sources,
        grounded: sources.length > 0,
        model: m,
      };
    }, cfg.factBudgetMs);
    return value;
  } catch (e) {
    return null; 
  }
}

// ----------------------------------------------------------------------------- public API
function degraded(text, reason) {
  return { ...wordingCheck(text), model: 'heuristic', truth: null, degraded: true, degradedReason: reason, cached: false };
}

exports.analyze = async (rawText, rawUrl = '') => {
  const text = String(rawText || '').replace(/https?:\/\/\S+/g, '').trim().slice(0, cfg.maxChars);
  const url = String(rawUrl || '').slice(0, 500);

  const key = crypto.createHash('sha256').update(`${text}|${url}`).digest('hex');
  const hit = cache.get(key);
  if (hit) return { ...hit, cached: true };

  if (cfg.mock) return { ...mockAnalysis(text), cached: false };
  if (!cfg.apiKey) {
    noteError('config', new groq.GroqError('GROQ_API_KEY is not set on the server', { status: 401 }));
    return degraded(text, 'not_configured');
  }

  let result;
  try {
    result = await assess(text, url);
  } catch (e) {
    const reason = e.status === 429 ? 'rate_limited' : e.status === 401 || e.status === 403 ? 'auth' : 'unavailable';
    return degraded(text, reason);
  }

  const truth = cfg.enableFactcheck && result.verdict !== 'REAL' ? await factCheck(text, result) : null;
  const payload = { ...result, truth, degraded: false, cached: false };
  cache.set(key, payload);
  return payload;
};

// Diagnostics (GET /api/analysis/status)
exports.status = async () => {
  const out = {
    configured: Boolean(cfg.apiKey) || cfg.mock, mock: cfg.mock, reachable: false, latencyMs: null,
    assessModels: [], factModels: [], searchGrounding: false, lastError, hints: [],
  };
  if (cfg.mock) { out.reachable = true; out.hints.push('MOCK_LLM is on: results are fake. Turn it off in production.'); return out; }
  if (!cfg.apiKey) { out.hints.push('GROQ_API_KEY is not set. Add it in Render -> Environment.'); return out; }

  const started = Date.now();
  try {
    await models.refresh();
    out.reachable = true;
    out.latencyMs = Date.now() - started;
    out.assessModels = await models.resolve(cfg.assessModels);
    out.factModels = await models.resolve(cfg.factModels);
    out.searchGrounding = out.factModels.some(isSearchModel);
  } catch (e) {
    out.error = `${e.status || 'network'}: ${e.message}`;
    out.hints.push(e.status === 401 || e.status === 403
      ? 'Groq rejected the API key. Create a new key at console.groq.com and update GROQ_API_KEY.'
      : 'Could not reach Groq. Check the Groq status page and your network.');
    return out;
  }
  if (!out.assessModels.length) out.hints.push('No usable chat model found for this Groq key.');
  if (!out.searchGrounding) out.hints.push('Web-search fact-check model is not available on this key: fact-checks will use model knowledge only.');
  if (lastError) out.hints.push(`Last AI error: ${lastError.message}`);
  return out;
};