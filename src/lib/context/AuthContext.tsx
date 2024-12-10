import { createContext, useContext, useState, useEffect } from 'react';
import { UserModel } from '../db/models/user';
import type { User } from '../types/database';
import { debug } from '../utils/debug';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    debug.log('Auth state changed:', user ? { email: user.email, role: user.role } : 'logged out');
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const authenticatedUser = await UserModel.authenticate(email, password);
    debug.log('Login successful:', { email: authenticatedUser?.email, role: authenticatedUser?.role });
    setUser(authenticatedUser);
  };

  const logout = () => {
    debug.log('Logging out user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
