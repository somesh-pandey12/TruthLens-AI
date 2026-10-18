const cfg = require('./config');

class GroqError extends Error {
  constructor(message, { status = 0, retryAfter = null } = {}) {
    super(message);
    this.name = 'GroqError';
    this.status = status; // 0 = network / timeout
    this.retryAfter = retryAfter;
  }
}

async function request(path, { method = 'GET', body, timeoutMs } = {}) {
  const limit = timeoutMs || cfg.timeoutMs;
  if (!cfg.apiKey) throw new GroqError('GROQ_API_KEY is not set', { status: 401 });

  let res;
  try {
    res = await fetch(`${cfg.baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(limit),
    });
  } catch (e) {
    throw new GroqError(e.name === 'TimeoutError' ? 'Groq request timed out' : `Groq network error: ${e.message}`, { status: 0 });
  }

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML / empty body */ }

  if (!res.ok) {
    throw new GroqError(json?.error?.message || `Groq responded with HTTP ${res.status}`, {
      status: res.status,
      retryAfter: Number(res.headers.get('retry-after')) || null,
    });
  }
  return json;
}

exports.GroqError = GroqError;
exports.chat = (payload, timeoutMs) => request('/chat/completions', { method: 'POST', body: payload, timeoutMs });
exports.listModels = async () => {
  const json = await request('/models', { timeoutMs: Math.min(cfg.timeoutMs, 8000) });
  return (json?.data || []).filter((m) => m.active !== false).map((m) => m.id);
};