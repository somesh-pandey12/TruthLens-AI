const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

app.listen(env.port, () => {
  console.log(`TruthLens API running on port ${env.port}`);
  console.log(`Allowed origins: ${env.clientUrls.join(', ')}`);
});

connectDB().catch((e) => console.error('MongoDB connection failed:', e.message));
if (env.isProd && env.selfUrl) {
  setInterval(() => fetch(`${env.selfUrl}/health`).catch(() => {}), 10 * 60 * 1000);
}