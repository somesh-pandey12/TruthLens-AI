require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';
if (isProd && process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production');
  process.exit(1);
}

module.exports = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  mlServiceUrl: (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, ''),
  mlApiKey: process.env.ML_API_KEY || '',
  selfUrl: process.env.RENDER_EXTERNAL_URL || '',
};