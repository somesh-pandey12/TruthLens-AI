require('dotenv').config();

const clean = (s) => String(s || '').trim().replace(/\/+$/, '');

const env = {
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map(clean)
    .filter(Boolean),
  groqKey: (process.env.GROQ_API_KEY || '').trim(),
  groqModel: (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile').trim(),
  tavilyKey: (process.env.TAVILY_API_KEY || '').trim(),
  selfUrl: clean(process.env.RENDER_EXTERNAL_URL),
};

['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY', 'TAVILY_API_KEY'].forEach((k) => {
  if (!process.env[k]) console.warn(`[env] WARNING: ${k} is not set`);
});

module.exports = env;