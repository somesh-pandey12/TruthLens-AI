const groq = require('./groq');

const TTL_MS = 60 * 60 * 1000;
let cache = { at: 0, ids: null };

const EXCLUDE = /whisper|guard|tts|orpheus|embed|safeguard|distil/i;
const CHAT_FAMILY = /gpt-oss|llama|qwen|kimi|deepseek|mistral/i;

exports.refresh = async () => {
  const ids = await groq.listModels();
  cache = { at: Date.now(), ids };
  return ids;
};

exports.available = async () => {
  if (cache.ids && Date.now() - cache.at < TTL_MS) return cache.ids;
  try {
    return await exports.refresh();
  } catch {
    return cache.ids; 
  }
};

exports.invalidate = () => { cache = { at: 0, ids: null }; };

exports.resolve = async (preferred) => {
  const ids = await exports.available();
  if (!ids) return preferred;
  const present = preferred.filter((m) => ids.includes(m));
  if (present.length) return present;
  return ids.filter((id) => CHAT_FAMILY.test(id) && !EXCLUDE.test(id));
};