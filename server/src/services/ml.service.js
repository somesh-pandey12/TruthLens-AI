const axios = require('axios');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const http = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: 60000, 
  headers: env.mlApiKey ? { 'x-api-key': env.mlApiKey } : {},
});

exports.analyze = async (text, url) => {
  try {
    const { data } = await http.post('/analyze', { text, url });
    return data;
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    if (body?.error === 'ai_unavailable') {
      console.error('ML service reported AI failure:', body.details);
      throw new ApiError(
        502,
        env.isProd ? 'AI provider error. Please try again later.' : `AI provider error: ${body.details}`
      );
    }
    if (status === 429) {
      const retryAfter = Number(body?.retryAfter) || 30;
      throw new ApiError(429, `AI service is busy (quota limit). Try again in ${retryAfter}s.`, { retryAfter });
    }
    if (status === 401) throw new ApiError(502, 'ML service rejected the API key (check ML_API_KEY).');

    if (['ECONNREFUSED', 'ECONNABORTED', 'ENOTFOUND', 'ECONNRESET'].includes(err.code) || status === 502 || status === 503) {
      console.error(`Cannot reach ML service at ${env.mlServiceUrl} (${err.code || status})`);
      throw new ApiError(503, 'AI service is waking up or unavailable. Try again in 30 seconds.');
    }
    console.error('Unexpected ML error:', err.message);
    throw new ApiError(502, 'AI service error. Please try again.');
  }
};