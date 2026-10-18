
class TTLCache {
  constructor(max = 300, ttlMs = 60 * 60 * 1000) {
    this.max = max;
    this.ttl = ttlMs;
    this.map = new Map();
  }

  get(key) {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() - entry.t > this.ttl) {
      this.map.delete(key);
      return null;
    }
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.v;
  }

  set(key, value) {
    this.map.delete(key);
    this.map.set(key, { v: value, t: Date.now() });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }
}

module.exports = TTLCache;