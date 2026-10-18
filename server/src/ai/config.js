require('../config/env'); 

const list = (value, fallback) =>
  (value || fallback).split(',').map((s) => s.trim()).filter(Boolean);

module.exports = {
  apiKey: (process.env.GROQ_API_KEY || '').trim(),
  baseUrl: (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, ''),
  mock: /^(1|true|yes)$/i.test(process.env.MOCK_LLM || ''),
  assessModels: list(process.env.GROQ_MODELS, 'openai/gpt-oss-120b,openai/gpt-oss-20b,llama-3.3-70b-versatile,llama-3.1-8b-instant'),
  factModels: list(process.env.FACTCHECK_MODELS, 'groq/compound-mini,openai/gpt-oss-120b,openai/gpt-oss-20b'),
  enableFactcheck: !/^(0|false|no)$/i.test(process.env.ENABLE_FACTCHECK || 'true'),

  maxTokens: Number(process.env.MAX_COMPLETION_TOKENS) || 1200,
  reasoningEffort: process.env.REASONING_EFFORT || 'low', 
  timeoutMs: Number(process.env.GROQ_TIMEOUT_MS) || 30000, 
  assessBudgetMs: Number(process.env.ASSESS_BUDGET_MS) || 35000,
  factBudgetMs: Number(process.env.FACT_BUDGET_MS) || 30000,
  cacheTtlMs: (Number(process.env.CACHE_TTL_SECONDS) || 3600) * 1000,
  maxChars: 2000,
};