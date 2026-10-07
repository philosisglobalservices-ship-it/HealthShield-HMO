import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

export const AuthContext = createContext(null);

const DEMO_ACCOUNTS = {
  'admin@healthshield.ng': { password: 'Admin@123', role: 'super_admin', firstName: 'System', lastName: 'Administrator' },
  'claims@healthshield.ng': { password: 'Staff@123', role: 'claims_officer', firstName: 'Fatima', lastName: 'Bello' },
  'finance@healthshield.ng': { password: 'Staff@123', role: 'finance_officer', firstName: 'Chukwuemeka', lastName: 'Obi' },
  'medical@healthshield.ng': { password: 'Staff@123', role: 'medical_officer', firstName: 'Dr. Aisha', lastName: 'Mohammed' },
  'ops@healthshield.ng': { password: 'Staff@123', role: 'operations_manager', firstName: 'Tunde', lastName: 'Adeyemi' },
  'cs@healthshield.ng': { password: 'Staff@123', role: 'customer_service', firstName: 'Ngozi', lastName: 'Eze' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('hmo_token');
    const savedUser = localStorage.getItem('hmo_user');

    if (!token) {
      setIsLoading(false);
      return;
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_) {}
    }

    authApi.me()
      .then((res) => {
        const u = res.data?.user || res.data;
        if (u) {
          setUser(u);
          localStorage.setItem('hmo_user', JSON.stringify(u));
        }
      })
      .catch(() => {
        // If savedUser existed, keep it (offline/demo resilience)
        if (!savedUser) {
          localStorage.removeItem('hmo_token');
          localStorage.removeItem('hmo_user');
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const cleanEmail = email.toLowerCase().trim();
    const demo = DEMO_ACCOUNTS[cleanEmail];

    try {
      const res = await authApi.login(email, password);
      const { token, user: userData } = res.data || {};
      if (token && userData) {
        localStorage.setItem('hmo_token', token);
        localStorage.setItem('hmo_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
    } catch (apiErr) {
      // If remote API is unavailable (e.g. deployed on Vercel standalone), check demo credentials client-side
      if (demo && demo.password === password) {
        const demoUser = {
          id: `demo-${Date.now()}`,
          email: cleanEmail,
          firstName: demo.firstName,
          lastName: demo.lastName,
          role: demo.role,
          permissions: ['*'],
          organizationId: 'demo-org',
          orgName: 'HealthShield Nigeria HMO',
          orgType: 'hmo',
          mfaEnabled: false,
        };
        const demoToken = `demo-token-${Date.now()}`;
        localStorage.setItem('hmo_token', demoToken);
        localStorage.setItem('hmo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return demoUser;
      }
      throw apiErr;
    }

    if (demo && demo.password === password) {
      const demoUser = {
        id: `demo-${Date.now()}`,
        email: cleanEmail,
        firstName: demo.firstName,
        lastName: demo.lastName,
        role: demo.role,
        permissions: ['*'],
        organizationId: 'demo-org',
        orgName: 'HealthShield Nigeria HMO',
        orgType: 'hmo',
        mfaEnabled: false,
      };
      const demoToken = `demo-token-${Date.now()}`;
      localStorage.setItem('hmo_token', demoToken);
      localStorage.setItem('hmo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      return demoUser;
    }

    throw new Error('Invalid email or password');
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
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
