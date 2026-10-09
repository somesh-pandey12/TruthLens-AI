const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} (${env.isProd ? 'production' : 'development'})`);
    console.log(`Allowed origins: ${env.clientUrls.join(', ')}`);

    if (env.selfUrl && env.isProd) {
      setInterval(() => {
        fetch(`${env.selfUrl}/health`).catch((e) => console.warn('Self-ping failed:', e.message));
      }, 14 * 60 * 1000);
    }
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});