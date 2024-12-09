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
  console.log('AuthProvider initializing...');
  const [user, setUser] = useLocalStorage<User | null>('user', null);
  console.log('Current user state:', user);

  // Verify stored user on mount
  useEffect(() => {
    const verifyUser = async () => {
      console.log('Verifying user...');
      if (user?.email) {
        try {
          console.log('Verifying user with email:', user.email);
          const verifiedUser = await AuthService.verify(user.email);
          if (!verifiedUser) {
            console.log('User verification failed, clearing user');
            setUser(null);
          } else {
            console.log('User verified successfully');
          }
        } catch (error) {
          console.error('User verification failed:', error);
          setUser(null);
        }
      } else {
        console.log('No user to verify');
      }
    };

    verifyUser();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('Attempting login...');
    try {
      const authenticatedUser = await AuthService.login(email, password);
      console.log('Login successful:', authenticatedUser);
      setUser(authenticatedUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    console.log('Attempting signup...');
    try {
      const newUser = await AuthService.register(email, password, name);
      console.log('Signup successful:', newUser);
      setUser(newUser);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
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

  console.log('AuthProvider rendering with context:', { isAuthenticated: !!user });

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
