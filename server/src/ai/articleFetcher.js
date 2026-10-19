const cheerio = require('cheerio');

const TIMEOUT_MS = 8000;
const MAX_HOPS = 4;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

function isSafeUrl(u) {
  try {
    const { protocol, hostname } = new URL(u);
    if (!['http:', 'https:'].includes(protocol)) return false;
    const h = hostname.toLowerCase();
    if (h === 'localhost' || h.startsWith('[') || h.endsWith('.local') || h.endsWith('.internal')) return false;
    if (/^(127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return false;
    return true;
  } catch {
    return false;
  }
}
function titleFromSlug(u) {
  try {
    const last = new URL(u).pathname.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(last).replace(/-\d+$/, '').replace(/[-_]+/g, ' ').trim();
  } catch {
    return '';
  }
}

async function safeGet(url, signal) {
  let current = url;
  for (let i = 0; i < MAX_HOPS; i++) {
    if (!isSafeUrl(current)) return null;
    const r = await fetch(current, {
      signal,
      redirect: 'manual',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' },
    });
    const loc = r.headers.get('location');
    if (r.status >= 300 && r.status < 400 && loc) {
      current = new URL(loc, current).href;
      continue;
    }
    return r;
  }
  return null;
}

// Never throws. Returns { title, description, text, blocked } or null when no url.
async function fetchArticle(url) {
  if (!url || !isSafeUrl(url)) return null;
  const slugTitle = titleFromSlug(url);
  const fallback = { title: slugTitle, description: '', text: '', blocked: true };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await safeGet(url, ctrl.signal);
    if (!r || !r.ok) return fallback;
    if (!(r.headers.get('content-type') || '').includes('html')) return fallback;

    const html = (await r.text()).slice(0, 500000);
    const $ = cheerio.load(html);

    const title = (
      $("meta[property='og:title']").attr('content') ||
      $('title').text() ||
      slugTitle
    ).trim();
    const description = (
      $("meta[property='og:description']").attr('content') ||
      $("meta[name='description']").attr('content') ||
      ''
    ).trim();

    $('script,style,nav,footer,header,aside,form,noscript,iframe').remove();
    const nodes = $('article p').length ? $('article p') : $('p');
    const paras = nodes
      .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
      .get()
      .filter((t) => t.length > 40);

    const text = paras.join('\n').slice(0, 6000);
    return { title, description, text, blocked: !text && !description };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchArticle };