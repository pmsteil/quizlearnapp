import { UserModel } from '../db/models/user';
import { User } from '@/types/user';

export class AuthService {
  static async login(email: string, password: string): Promise<User | null> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const user = await UserModel.authenticate(email, password);
      if (user) {
        return {
          ...user,
          roles: user.roles || ['role_user']
        };
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async register(email: string, password: string, name: string): Promise<User> {
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required');
    }

    try {
      const user = await UserModel.create(email, password, name);
      return {
        ...user,
        roles: user.roles || ['role_user']
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async verify(email: string): Promise<User | null> {
    if (!email) return null;

    try {
      const user = await UserModel.getByEmail(email);
      if (user) {
        return {
          ...user,
          roles: user.roles || ['role_user']
        };
      }
      return null;
    } catch (error) {
      console.error('Verification error:', error);
      return null;
    }
  }

  static async getUser(): Promise<User | null> {
    return null;
  }
}
