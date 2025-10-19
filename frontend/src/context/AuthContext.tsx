import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, setAuthToken } from '../services/api';

interface AuthContextValue {
  token: string | null;
  userEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'classroom-token';
const EMAIL_KEY = 'classroom-email';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [userEmail, setUserEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));
  const navigate = useNavigate();

  useEffect(() => {
    setAuthToken(token);
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(EMAIL_KEY, userEmail);
    } else {
      localStorage.removeItem(EMAIL_KEY);
    }
  }, [userEmail]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post(
      '/auth/token',
      new URLSearchParams({ username: email, password }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const accessToken = response.data.access_token;
    setToken(accessToken);
    setUserEmail(email);
    navigate('/');
  }, [navigate]);

  const logout = useCallback(() => {
    setToken(null);
    setUserEmail(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo(() => ({ token, userEmail, login, logout }), [token, userEmail, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
