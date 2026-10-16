const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ML_TIMEOUT_MS = 90000;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = Number(process.env.ML_RETRY_DELAY_MS) || 8000;

const isLocalUrl = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(env.mlServiceUrl);
if (env.isProd && isLocalUrl) {
  console.error(
    `CONFIG ERROR: ML_SERVICE_URL is "${env.mlServiceUrl}" in production. ` +
      "Set ML_SERVICE_URL on this service to your ML service's https URL (Render -> truthlens-api -> Environment)."
  );
}

const http = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: ML_TIMEOUT_MS,
  headers: env.mlApiKey ? { 'x-api-key': env.mlApiKey } : {},
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isStarting = (err) =>
  [502, 503, 504].includes(err.response?.status) && err.response?.data?.error !== 'ai_unavailable';

let lastWarm = 0;
exports.warm = () => {
  if (Date.now() - lastWarm < 60000) return;
  lastWarm = Date.now();
  http.get('/health', { timeout: 120000 }).catch(() => {});
};

function toApiError(err) {
  const status = err.response?.status;
  const body = err.response?.data;

  if (body?.error === 'ai_unavailable') {
    console.error('ML service reported AI failure:', body.details);
    return new ApiError(502, env.isProd ? 'AI provider error. Please try again later.' : `AI provider error: ${body.details}`);
  }
  if (status === 429) {
    const retryAfter = Number(body?.retryAfter) || 30;
    return new ApiError(429, `AI service is busy (quota limit). Try again in ${retryAfter}s.`, { retryAfter });
  }
  if (status === 401) {
    console.error('ML service rejected the API key: ML_API_KEY differs between the API and ML services.');
    return new ApiError(502, 'ML service rejected the API key (check ML_API_KEY).');
  }

  if (['ECONNREFUSED', 'ECONNABORTED', 'ENOTFOUND', 'ECONNRESET'].includes(err.code) || [502, 503, 504].includes(status)) {
    console.error(`Cannot reach ML service at ${env.mlServiceUrl} (code=${err.code || '-'}, status=${status || '-'})`);
    return new ApiError(503, 'AI service is waking up or unavailable. Try again in 30 seconds.');
  }
  console.error('Unexpected ML error:', err.message);
  return new ApiError(502, 'AI service error. Please try again.');
}

exports.analyze = async (text, url) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const { data } = await http.post('/analyze', { text, url });
      return data;
    } catch (err) {
      if (attempt < MAX_RETRIES && isStarting(err)) {
        const wait = RETRY_BASE_MS * (attempt + 1);
        console.warn(`ML service not ready (status ${err.response?.status}), retry ${attempt + 1}/${MAX_RETRIES} in ${wait}ms`);
        await sleep(wait);
        continue; 
      }
      throw toApiError(err);
    }
  }
};

exports.diagnose = async () => {
  const mlHost = (() => { try { return new URL(env.mlServiceUrl).host; } catch { return env.mlServiceUrl; } })();
  const out = { ok: false, mlHost, configured: !(env.isProd && isLocalUrl), reachable: false, latencyMs: null, keyAccepted: null, error: null, hints: [] };

  if (!out.configured) {
    out.hints.push('ML_SERVICE_URL is not set on the API service (it defaults to localhost). Set it to your ML service https URL and redeploy.');
    return out;
  }

  const started = Date.now();
  try {
    await http.get('/health', { timeout: 100000 });
    out.reachable = true;
    out.latencyMs = Date.now() - started;
  } catch (err) {
    out.error = err.code || err.response?.status || err.message;
    if (['ECONNREFUSED', 'ENOTFOUND'].includes(err.code)) out.hints.push('Cannot connect. Check ML_SERVICE_URL spelling: it must be the full https:// URL of the ML service with no trailing slash.');
    else if (err.code === 'ECONNABORTED') out.hints.push('Timed out. The ML service is probably still waking up (free tier). Wait a minute and try again.');
    else if ([502, 503, 504].includes(err.response?.status)) out.hints.push('The ML service is starting or has crashed. Open its Render logs and look for the error.');
    else out.hints.push(`Unexpected response from the ML service (${out.error}).`);
    return out;
  }

  try {
    await http.post('/analyze', {});
    out.keyAccepted = true;
  } catch (err) {
    out.keyAccepted = err.response?.status !== 401;
  }
  if (out.keyAccepted === false) out.hints.push('ML_API_KEY is different on the two services. Make them identical.');
  if (out.latencyMs > 15000) out.hints.push('The first response was slow: the ML service had been asleep (free tier cold start).');
  out.ok = out.reachable && out.keyAccepted !== false;
  if (out.ok && !out.hints.length) out.hints.push('Everything looks fine.');
  return out;
};