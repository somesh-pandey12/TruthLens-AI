const env = require('../config/env');

const BASE = 'https://api.tavily.com';

async function call(path, body, timeoutMs = 20000) {
  if (!env.tavilyKey) throw new Error('TAVILY_API_KEY is not set');
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.tavilyKey}` },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Tavily ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

const domainOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

exports.search = async (query) => {
  const data = await call('/search', {
    query: query.slice(0, 390),
    search_depth: 'basic',
    max_results: 6,
    include_answer: false,
  });
  return (data.results || []).map((r) => ({
    title: r.title || '',
    url: r.url,
    domain: domainOf(r.url),
    content: (r.content || '').slice(0, 700),
  }));
};

exports.extract = async (url) => {
  const data = await call('/extract', { urls: [url] }, 25000);
  const r = data.results && data.results[0];
  if (!r || !r.raw_content) return null;
  return { url, domain: domainOf(url), content: r.raw_content.slice(0, 4000) };
};

exports.domainOf = domainOf;