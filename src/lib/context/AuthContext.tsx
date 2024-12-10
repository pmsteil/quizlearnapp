import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '../types/database';
import { UserService } from '../services/user';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            createdAt: new Date(parsedUser.createdAt),
            updatedAt: new Date(parsedUser.updatedAt)
          });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const authenticatedUser = await UserService.login(email, password);
    setUser({
      ...authenticatedUser,
      createdAt: new Date(authenticatedUser.createdAt),
      updatedAt: new Date(authenticatedUser.updatedAt)
    });
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
  };

  const signup = async (email: string, password: string, name: string) => {
    const newUser = await UserService.signup(email, password, name);
    setUser({
      ...newUser,
      createdAt: new Date(newUser.createdAt),
      updatedAt: new Date(newUser.updatedAt)
    });
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
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
