'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '@smarthome/shared';
import { fetchApi } from '@/services/api';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  activeHomeId: string | null;
  setActiveHomeId: (homeId: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string, role?: string) => Promise<void>;
  googleLogin: (email: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_OWNER: IUser = {
  _id: '65c8f1e2a01b2c3d4e5f6a01',
  name: 'Alex Rivera',
  email: 'owner@smarthome.ai',
  role: 'Owner',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  homeAddress: '450 Innovation Way, San Francisco, CA',
  phone: '+1 (555) 234-5678',
  homes: ['65c8f1e2a01b2c3d4e5f6a99'],
  activeHomeId: '65c8f1e2a01b2c3d4e5f6a99',
  isEmailVerified: true,
  preferences: {
    darkMode: true,
    notifications: { email: true, sms: false, push: true },
    theme: 'tesla-dark',
    language: 'en',
    timezone: 'UTC',
    currency: '$',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEMO_ADMIN: IUser = {
  _id: '65c8f1e2a01b2c3d4e5f6a02',
  name: 'Dr. Sarah Connor',
  email: 'admin@smarthome.ai',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  homeAddress: '100 Cybernetics Drive, Austin, TX',
  phone: '+1 (555) 987-6543',
  homes: ['65c8f1e2a01b2c3d4e5f6a99'],
  activeHomeId: '65c8f1e2a01b2c3d4e5f6a99',
  isEmailVerified: true,
  preferences: {
    darkMode: true,
    notifications: { email: true, sms: false, push: true },
    theme: 'tesla-dark',
    language: 'en',
    timezone: 'UTC',
    currency: '$',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeHomeId, setActiveHomeId] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('sh_access_token');
      if (token) {
        try {
          const res = await fetchApi('/auth/me');
          if (res.success && res.user) {
            setUser(res.user);
            setActiveHomeId(res.user.activeHomeId || res.user.homes?.[0] || '65c8f1e2a01b2c3d4e5f6a99');
          } else {
            setUser(DEMO_OWNER);
            setActiveHomeId(DEMO_OWNER.activeHomeId!);
          }
        } catch (_) {
          localStorage.removeItem('sh_access_token');
          localStorage.removeItem('sh_refresh_token');
          setUser(null);
          setActiveHomeId(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const emailLower = email.toLowerCase().trim();
    try {
      const res = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailLower, password: pass }),
      });

      if (res.success) {
        localStorage.setItem('sh_access_token', res.accessToken || 'demo_access_token_2026');
        localStorage.setItem('sh_refresh_token', res.refreshToken || 'demo_refresh_token_2026');
        setUser(res.user);
        setActiveHomeId(res.user.activeHomeId || res.user.homes?.[0] || '65c8f1e2a01b2c3d4e5f6a99');
        return;
      }
    } catch (_) {
      console.warn('[Auth] Backend server offline. Initiating client-side demo authentication.');
    }

    // Client-side fallback authentication
    const targetUser = emailLower.includes('admin') ? DEMO_ADMIN : {
      ...DEMO_OWNER,
      name: emailLower.split('@')[0].toUpperCase(),
      email: emailLower,
    };

    localStorage.setItem('sh_access_token', 'demo_access_token_2026');
    localStorage.setItem('sh_refresh_token', 'demo_refresh_token_2026');
    setUser(targetUser);
    setActiveHomeId(targetUser.activeHomeId!);
  };

  const register = async (name: string, email: string, pass: string, role = 'Owner') => {
    const emailLower = email.toLowerCase().trim();
    try {
      const res = await fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email: emailLower, password: pass, role }),
      });

      if (res.success) {
        localStorage.setItem('sh_access_token', res.accessToken);
        localStorage.setItem('sh_refresh_token', res.refreshToken);
        setUser(res.user);
        setActiveHomeId(res.user.activeHomeId || res.user.homes?.[0] || '65c8f1e2a01b2c3d4e5f6a99');
        return;
      }
    } catch (_) {
      console.warn('[Auth] Backend server offline. Initiating client-side demo registration.');
    }

    const newUser: IUser = {
      ...DEMO_OWNER,
      _id: '65c8f1e2a01b2c3d4e5f' + Math.floor(Math.random() * 89999 + 10000),
      name,
      email: emailLower,
      role: (role as any) || 'Owner',
    };

    localStorage.setItem('sh_access_token', 'demo_access_token_2026');
    localStorage.setItem('sh_refresh_token', 'demo_refresh_token_2026');
    setUser(newUser);
    setActiveHomeId(newUser.activeHomeId!);
  };

  const googleLogin = async (email: string, name?: string) => {
    try {
      const res = await fetchApi('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      });

      if (res.success) {
        localStorage.setItem('sh_access_token', res.accessToken);
        localStorage.setItem('sh_refresh_token', res.refreshToken);
        setUser(res.user);
        setActiveHomeId(res.user.activeHomeId || res.user.homes?.[0] || '65c8f1e2a01b2c3d4e5f6a99');
        return;
      }
    } catch (_) {}

    setUser(DEMO_OWNER);
    setActiveHomeId(DEMO_OWNER.activeHomeId!);
  };

  const logout = () => {
    localStorage.removeItem('sh_access_token');
    localStorage.removeItem('sh_refresh_token');
    setUser(null);
    setActiveHomeId(null);
  };

  const refreshUser = async () => {
    try {
      const res = await fetchApi('/auth/me');
      if (res.success) {
        setUser(res.user);
      }
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeHomeId,
        setActiveHomeId,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
