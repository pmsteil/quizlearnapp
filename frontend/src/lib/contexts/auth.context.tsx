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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const tokenData = TokenManager.getTokenData();
        if (tokenData?.user) {
          setUser(tokenData.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const tokenData = TokenManager.getTokenData();
      if (!tokenData) {
        return;
      }

      try {
        if (TokenManager.isTokenExpired()) {
          const refreshToken = tokenData.refresh_token;
          if (!refreshToken) {
            console.log('No refresh token, logging out');
            logout();
            return;
          }
          const response = await authService.refreshToken(refreshToken);
          TokenManager.setToken(response.token);
        } else {
          console.log('Token valid, getting user data');
          const user = await authService.getCurrentUser();
          setUser(user);
        }
      } catch (err) {
        console.error('Error refreshing token:', err);
        logout();
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      TokenManager.setTokenData(response);
      setUser(response.user);
      toast({
        title: "Success",
        description: "Successfully logged in",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log in. Please check your credentials.",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    try {
      const { user: newUser, token } = await authService.signup(email, password);
      TokenManager.setToken(token);
      setUser(newUser);
      toast({
        title: "Success",
        description: "Successfully signed up",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    TokenManager.clearTokens();
    setUser(null);
    toast({
      title: "Success",
      description: "Successfully logged out",
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, signup }}>
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
