const env = require('../config/env');
const { HttpError } = require('../utils/helpers');
exports.chatJson = async (system, user) => {
  if (!env.groqKey) throw new HttpError(503, 'AI is not configured on the server (GROQ_API_KEY missing)');

  let res;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.groqKey}` },
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (e) {
    throw new HttpError(504, 'AI service timed out. Please try again.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[groq]', res.status, data?.error?.message);
    if (res.status === 401) throw new HttpError(502, 'AI key was rejected. Check GROQ_API_KEY.');
    if (res.status === 429) throw new HttpError(429, 'AI is busy right now. Try again in a minute.');
    throw new HttpError(502, 'AI service error. Please try again.');
  }

  const raw = data.choices?.[0]?.message?.content || '';
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    throw new HttpError(502, 'AI returned an invalid response. Please try again.');
  }
};