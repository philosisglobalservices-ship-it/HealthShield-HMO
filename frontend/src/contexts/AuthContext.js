import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('hmo_token');
    if (!token) { setIsLoading(false); return; }
    authApi.me()
      .then((res) => setUser(res.data.user))
      .catch(() => { localStorage.removeItem('hmo_token'); localStorage.removeItem('hmo_user'); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { token, user: userData } = res.data;
    localStorage.setItem('hmo_token', token);
    localStorage.setItem('hmo_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('hmo_token');
    localStorage.removeItem('hmo_user');
    setUser(null);
  }, []);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }, [user]);

  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    return (user.permissions || []).includes(permission);
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user, isLoading,
      isAuthenticated: !!user,
      login, logout, hasRole, hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
