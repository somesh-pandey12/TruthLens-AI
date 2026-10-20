const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const TOKEN_KEY = 'truthlens_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(path, { method = 'GET', body, timeout = 90000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const token = tokenStore.get();

  try {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('The request timed out. The server may be waking up — try again in 30 seconds.');
    if (e instanceof TypeError) throw new Error('Cannot reach the server. Check your connection and try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
export const wakeServer = () => request('/health', { timeout: 20000 }).catch(() => {});

export const register = (b) => request('/api/auth/register', { method: 'POST', body: b });
export const login = (b) => request('/api/auth/login', { method: 'POST', body: b });
export const getMe = () => request('/api/auth/me');
export const analyze = (b) => request('/api/analysis/analyze', { method: 'POST', body: b, timeout: 120000 });
export const getHistory = (page = 1) => request(`/api/analysis/history?page=${page}`);
export const deleteAnalysis = (id) => request(`/api/analysis/history/${id}`, { method: 'DELETE' });