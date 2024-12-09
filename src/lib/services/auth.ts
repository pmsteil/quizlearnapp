import { UserModel } from '../db/models/user';
import type { User } from '../types/database';

export class AuthService {
  static async login(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    try {
      const user = await UserModel.authenticate(email, password);
      return user;
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
      return await UserModel.create(email, password, name);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async verify(email: string): Promise<User | null> {
    if (!email) {
      return null;
    }

    try {
      return await UserModel.getByEmail(email);
    } catch (error) {
      console.error('Verification error:', error);
      return null;
    }
  }
}