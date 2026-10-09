import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const loginSuccess = useCallback((token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    getMe()
      .then((res) => setUser(res.data.user))
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout }}>{children}</AuthContext.Provider>
  );
}