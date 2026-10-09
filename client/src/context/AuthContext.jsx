import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getMe, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const loginSuccess = useCallback((token, userData) => {
    tokenStore.set(token);
    setUser(userData);
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
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