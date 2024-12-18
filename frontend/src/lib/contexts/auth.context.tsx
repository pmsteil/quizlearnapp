import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TokenManager } from '../utils/token';
import { type User } from '../services';
import { authService } from '../services';
import { toast } from '@/components/ui/use-toast';

interface User {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    TokenManager.clearTokens();
    setUser(null);
  }, []);

  // Single initialization effect
  useEffect(() => {
    const initAuth = async () => {
      try {
        const tokenData = TokenManager.getTokenData();
        if (!tokenData) {
          console.log('No token data found');
          setInitializing(false);
          return;
        }

        if (TokenManager.isTokenExpired()) {
          console.log('Token expired, attempting refresh');
          const refreshToken = tokenData.refresh_token;
          if (!refreshToken) {
            console.log('No refresh token available');
            logout();
            setInitializing(false);
            return;
          }

          try {
            const response = await authService.refreshToken(refreshToken);
            TokenManager.setTokenData(response);
            setUser(response.user);
          } catch (error) {
            console.error('Error refreshing token:', error);
            logout();
          }
        } else {
          console.log('Token valid, setting user data');
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } catch (error) {
            console.error('Error getting current user:', error);
            logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setInitializing(false);
      }
    };

    initAuth();
  }, [logout]);

  const login = async (email: string, password: string) => {
    try {
      setInitializing(true);
      const response = await authService.login({ email, password });
      TokenManager.setTokenData(response);
      setUser(response.user);
      toast({
        title: "Success",
        description: "Successfully logged in",
      });
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setInitializing(false);
    }
  };

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      setInitializing(true);
      const response = await authService.register({ name, email, password });
      TokenManager.setTokenData(response);
      setUser(response.user);
      toast({
        title: "Success",
        description: "Successfully registered",
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setInitializing(false);
    }
  }, []);

  const value = {
    user,
    initializing,
    login,
    logout,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
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
