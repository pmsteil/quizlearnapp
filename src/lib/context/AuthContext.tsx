import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { AuthService } from '../services/auth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('user', null);

  // Verify stored user on mount
  useEffect(() => {
    const verifyUser = async () => {
      if (user?.email) {
        try {
          const verifiedUser = await AuthService.verify(user.email);
          if (!verifiedUser) {
            setUser(null);
          }
        } catch (error) {
          console.error('User verification failed:', error);
          setUser(null);
        }
      }
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const authenticatedUser = await AuthService.login(email, password);
      setUser(authenticatedUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const newUser = await AuthService.register(email, password, name);
      setUser(newUser);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const contextValue = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
