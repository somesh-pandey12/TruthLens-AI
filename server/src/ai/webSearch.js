
async function webSearch(query, maxResults = 6) {
  const key = process.env.TAVILY_API_KEY;
  const q = String(query || '').trim().slice(0, 300);
  if (!key || !q) return [];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        query: q,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: false,
      }),
    });
    if (!r.ok) {
      console.error(`[search] Tavily failed with status ${r.status}`);
      return [];
    }
    const data = await r.json();
    return (data.results || []).map((x) => ({
      title: String(x.title || '').slice(0, 140),
      url: String(x.url || ''),
      snippet: String(x.content || '').replace(/\s+/g, ' ').slice(0, 500),
    }));
  } catch (e) {
    console.error(`[search] failed: ${e.message}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { webSearch };