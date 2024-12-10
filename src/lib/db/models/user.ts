import { db } from '../client';
import { generateId, hashPassword, verifyPassword } from '../../utils/auth';
import type { User } from '../../types/database';
import { debug } from '../../utils/debug';

export class UserModel {
  static async create(email: string, password: string, name: string): Promise<User> {
    const id = generateId();
    const hashedPassword = await hashPassword(password);
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      const result = await db.execute({
        sql: `INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?)
              RETURNING *`,
        args: [id, email, hashedPassword, name, timestamp, timestamp]
      });

      if (!result.rows?.[0]) {
        throw new Error('Failed to create user');
      }

      return this.mapUser(result.rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async authenticate(email: string, password: string): Promise<User | null> {
    try {
      debug.log('Attempting to authenticate user:', email);

      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email.toLowerCase()]
      });

      debug.log('Query result:', result.rows);

      if (!result.rows?.length) {
        debug.log('No user found with email:', email);
        throw new Error('User not found');
      }

      const user = result.rows[0];
      debug.log('Found user:', {
        ...user,
        password_hash: '[REDACTED]'
      });

      const isValid = await verifyPassword(password, user.password_hash?.toString() || '');
      debug.log('Password validation result:', isValid);

      if (!isValid) {
        throw new Error('Invalid password');
      }

      return {
        id: String(user.id),
        email: String(user.email),
        name: String(user.name),
        createdAt: new Date(Number(user.created_at) * 1000),
        updatedAt: new Date(Number(user.updated_at) * 1000)
      };
    } catch (error) {
      debug.error('Authentication error:', error);
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
      throw error;
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
