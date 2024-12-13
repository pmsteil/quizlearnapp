import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../services';
import { authService } from '../services';
import { TokenManager } from '../utils/token';
import { useToast } from './toast.context';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const tokenData = TokenManager.getTokenData();
        if (tokenData?.user) {
          setUser(tokenData.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

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

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Attempting login with email:', email);
      const response = await authService.login({ email, password });
      console.log('Login successful, setting user');
      setUser(response.user);
      showToast('Successfully logged in', 'success');
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof AppError) {
        setError(err.message);
        showToast(err.message, 'error');
      } else {
        setError('An unexpected error occurred');
        showToast('Failed to log in', 'error');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const register = async (name: string, email: string, password: string) => {
    try {
      const { token, user } = await authService.register({ name, email, password });
      TokenManager.setTokens(token);
      setUser(user);
      setError(null);
      showToast({
        title: "Success",
        description: "Your account has been created successfully!",
        variant: "default"
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      showToast({
        title: "Registration Error",
        description: message,
        variant: "destructive"
      });
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
