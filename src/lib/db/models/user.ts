import { db } from '../client';
import { generateId } from '../../utils/auth';
import { hashPassword, verifyPassword } from '../../utils/auth';
import type { User } from '../../types/database';

export class UserModel {
  static async create(email: string, password: string, name: string): Promise<User> {
    const id = generateId();
    const timestamp = Math.floor(Date.now() / 1000);
    const passwordHash = await hashPassword(password);

    try {
      const result = await db.execute({
        sql: `INSERT INTO users (id, email, name, password_hash, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?) 
              RETURNING *`,
        args: [id, email, name, passwordHash, timestamp, timestamp]
      });

      if (!result.rows?.[0]) {
        throw new Error('Failed to create user');
      }

      return this.mapUser(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.message?.includes('UNIQUE constraint failed')) {
        throw new Error('Email already exists');
      }
      throw new Error('Failed to create user');
    }
  }

  static async authenticate(email: string, password: string): Promise<User> {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      });
      
      const user = result.rows?.[0];
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid email or password');
      }

      return this.mapUser(user);
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  static async getByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      });
      
      const user = result.rows?.[0];
      return user ? this.mapUser(user) : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  private static mapUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000)
    };
  }
}