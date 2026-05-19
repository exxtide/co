import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService, type AuthUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  // Новые методы для авторизации по телефону
  sendCode: (phone: string, method: 'telegram' | 'max') => Promise<{ phone: string; method: string; code?: string }>;
  verifyCode: (phone: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      return;
    }
    const u = await apiService.getCurrentUser();
    if (u) setUser(u);
    else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiService
      .getCurrentUser()
      .then((u) => {
        if (u) setUser(u);
        else localStorage.removeItem('token');
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  /** Отправка кода подтверждения */
  const sendCode = async (phone: string, method: 'telegram' | 'max') => {
    return await apiService.sendCode(phone, method);
  };

  /** Проверка кода и вход */
  const verifyCode = async (phone: string, code: string) => {
    const { token, user: u } = await apiService.verifyCode(phone, code);
    localStorage.setItem('token', token);
    setUser(u);
  };

  const signOut = async () => {
    await apiService.logout();
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, sendCode, verifyCode, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
