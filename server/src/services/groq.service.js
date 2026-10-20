const env = require('../config/env');
const { HttpError } = require('../utils/helpers');

async function callModel(model, system, user) {
  const body = {
    model,
    temperature: 0.1,
    max_tokens: 3000, 
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  if (model.includes('gpt-oss')) body.reasoning_effort = 'low';

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.groqKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const raw = data.choices?.[0]?.message?.content || '';
  return JSON.parse(raw.replace(/```json|```/g, '').trim()); 
}


exports.chatJson = async (system, user) => {
  if (!env.groqKey) throw new HttpError(503, 'AI is not configured on the server (GROQ_API_KEY missing)');

  let last;
  for (const model of env.groqModels) {
    try {
      return await callModel(model, system, user);
    } catch (e) {
      last = e;
      console.error(`[groq] model "${model}" failed:`, e.status || e.name, '-', e.message);
      if (e.status === 401) break;
    }
  }

  if (last?.status === 401) throw new HttpError(502, 'AI key was rejected. Check GROQ_API_KEY on Render.');
  if (last?.status === 429) throw new HttpError(429, 'AI is busy right now. Try again in a minute.');
  throw new HttpError(502, `AI service error (${last?.status || last?.name || 'unknown'}). Please try again.`);
};