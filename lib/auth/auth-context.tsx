'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'auth-token';
const COOKIE_NAME = 'auth-token';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  domainSlug: string | null;
  emailVerified: boolean;
  emailDomainVerified: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; needsPasswordReset?: boolean; email?: string }>;
  signup: (data: { name: string; email: string; password: string; companyName?: string; domainSlug: string }) => Promise<{ success: boolean; error?: string; email?: string }>;
  logout: () => void;
  getToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setTokenCookie(token: string | null) {
  if (token) {
    document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const setAuth = useCallback((newToken: string | null, newUser: AuthUser | null) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setTokenCookie(newToken);
  }, []);

  const fetchUser = useCallback(async (authToken: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }, []);

  // On mount: restore session from localStorage
  useEffect(() => {
    async function restore() {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (stored) {
        const userData = await fetchUser(stored);
        if (userData) {
          setAuth(stored, userData);
        } else {
          // Token expired/invalid
          setAuth(null, null);
        }
      }
      setIsLoaded(true);
    }
    restore();
  }, [fetchUser, setAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.error,
          needsVerification: data.needsVerification,
          needsPasswordReset: data.needsPasswordReset,
          email: data.email,
        };
      }

      setAuth(data.token, data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, [setAuth]);

  const signup = useCallback(async (signupData: { name: string; email: string; password: string; companyName?: string; domainSlug: string }) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error };
      }

      return { success: true, email: signupData.email };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null, null);
  }, [setAuth]);

  const getToken = useCallback(async () => {
    return token;
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (token) {
      const userData = await fetchUser(token);
      if (userData) {
        setUser(userData);
      }
    }
  }, [token, fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoaded,
        isSignedIn: !!user && !!token,
        login,
        signup,
        logout,
        getToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
