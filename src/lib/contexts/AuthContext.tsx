import { User } from '@/types/user';

export interface AuthContextType {
  user: User | null;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
