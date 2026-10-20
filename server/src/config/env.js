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

  groqModels: (process.env.GROQ_MODEL || 'openai/gpt-oss-120b,qwen/qwen3.6-27b,openai/gpt-oss-20b')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  get groqModel() { return this.groqModels[0]; },
  tavilyKey: (process.env.TAVILY_API_KEY || '').trim(),
  selfUrl: clean(process.env.RENDER_EXTERNAL_URL),
};

['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY', 'TAVILY_API_KEY'].forEach((k) => {
  if (!process.env[k]) console.warn(`[env] WARNING: ${k} is not set`);
});

module.exports = env;