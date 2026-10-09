import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 90000, 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const register = (data) => api.post('/api/auth/register', data);
export const login = (data) => api.post('/api/auth/login', data);
export const getMe = () => api.get('/api/auth/me');
export const analyzeText = (data) => api.post('/api/analysis/analyze', data);
export const getHistory = (params) => api.get('/api/analysis/history', { params });
export const getStats = () => api.get('/api/analysis/stats');
export const deleteAnalysis = (id) => api.delete(`/api/analysis/history/${id}`);
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err.code === 'ECONNABORTED') return 'Request timed out. Server may be waking up — try again in 30 seconds.';
  if (!err.response) return 'Cannot reach the server. Check your connection.';
  return err.response.data?.message || fallback;
}