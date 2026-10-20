const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { globalLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

// "https://x.vercel.app/" and "https://x.vercel.app" should both match
const allowedOrigins = (env.clientUrls || []).map((u) => String(u).trim().replace(/\/+$/, ''));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      console.warn(`[cors] blocked origin: ${origin} | allowed: ${allowedOrigins.join(', ') || '(none)'}`);
      cb(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(morgan(env.isProd ? 'combined' : 'dev'));

app.get('/', (req, res) => res.json({ name: 'TruthLens API', status: 'ok' }));

app.get('/health', (req, res) =>
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    commit: (process.env.RENDER_GIT_COMMIT || 'local').slice(0, 7), // which commit is live on Render
  })
);

app.use('/api', globalLimiter);
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/analysis', require('./routes/analysis.routes'));

app.use(notFound);
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') return res.status(403).json({ message: err.message });
  next(err);
});
app.use(errorHandler);

module.exports = app;