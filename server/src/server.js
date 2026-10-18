const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const KEEP_ALIVE_MS = 10 * 60 * 1000;

function startKeepAlive() {
  if (!env.isProd) return;
  if (!env.selfUrl) {
    console.warn('Keep-alive OFF: RENDER_EXTERNAL_URL is not set, so the free instance may sleep after 15 minutes.');
    return;
  }
  setInterval(() => {
    fetch(`${env.selfUrl}/health`, { signal: AbortSignal.timeout(20000) })
      .then((r) => console.log(`Keep-alive ping: ${r.status}`))
      .catch((e) => console.warn('Keep-alive ping failed:', e.message));
  }, KEEP_ALIVE_MS);
  console.log(`Keep-alive ON: pinging ${env.selfUrl}/health every 10 minutes`);
}

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} (${env.isProd ? 'production' : 'development'})`);
    console.log(`Allowed origins: ${env.clientUrls.join(', ')}`);
    startKeepAlive();
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});