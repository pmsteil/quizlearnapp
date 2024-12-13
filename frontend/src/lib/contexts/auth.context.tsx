import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../services';
import { authService } from '../services';
import { TokenManager } from '../utils/token';
import { useToast } from './toast.context';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const tokenData = TokenManager.getTokenData();
      if (!tokenData) {
        setLoading(false);
        return;
      }

      try {
        if (TokenManager.isTokenExpired()) {
          await authService.refreshToken();
        }
        const user = await authService.getMe();
        setUser(user);
      } catch (err) {
        TokenManager.clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { token, user } = await authService.login({ email, password });
      TokenManager.setTokens(token);
      setUser(user);
      setError(null);
      showToast('Successfully logged in', 'success');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { token, user } = await authService.register({ name, email, password });
      TokenManager.setTokens(token);
      setUser(user);
      setError(null);
      showToast('Registration successful', 'success');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      TokenManager.clearTokens();
      setUser(null);
      setError(null);
      showToast('Successfully logged out', 'success');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      showToast(message, 'error');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
