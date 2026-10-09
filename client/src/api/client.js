import axios from 'axios';

const TOKEN_KEY = 'truthlens_token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 90000, 
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Token expire/invalid 
    if (err.response?.status === 401 && tokenStore.get()) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');
export const analyzeText = (data) => api.post('/api/analysis/analyze', data);
export const getHistory = (params) => api.get('/api/analysis/history', { params });
export const getStats = () => api.get('/api/analysis/stats', { params: { tz: timeZone() } });
export const deleteAnalysis = (id) => api.delete(`/api/analysis/history/${id}`);
export const exportHistory = () => api.get('/api/analysis/export', { responseType: 'blob' });

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err.code === 'ECONNABORTED') return 'The request timed out. The server may be waking up — try again in 30 seconds.';
  if (!err.response) return 'Cannot reach the server. Check your connection.';
  return err.response.data?.message || fallback;
}