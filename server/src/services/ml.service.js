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
    if (status === 429) {
      const retryAfter = Number(err.response.data?.retryAfter) || 30;
      throw new ApiError(429, `AI service is busy (quota limit). Try again in ${retryAfter}s.`, { retryAfter });
    }
    if (status === 401) throw new ApiError(502, 'ML service rejected the API key (check ML_API_KEY).');
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED' || status === 502 || status === 503)
      throw new ApiError(503, 'AI service is waking up or unavailable. Try again in 30 seconds.');
    throw new ApiError(502, 'AI service error. Please try again.');
  }
};