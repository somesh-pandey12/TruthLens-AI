import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from '../lib/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(api.tokenStore.get()));

  const logout = useCallback(() => {
    api.tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!api.tokenStore.get()) return;
    api.getMe().then((r) => setUser(r.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);
  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const signIn = (data) => {
    api.tokenStore.set(data.token);
    setUser(data.user);
  };

  return <AuthContext.Provider value={{ user, loading, signIn, logout }}>{children}</AuthContext.Provider>;
}