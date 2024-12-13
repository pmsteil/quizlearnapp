import { db } from '../client';
import { generateId, hashPassword, verifyPassword } from '@backend/lib/utils/auth';
import { User } from '@shared/types';
import { debug } from '@backend/lib/utils/debug';
import { DateTime } from 'luxon';

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
        args: [email]
      });

      if (!result.rows?.length) {
        debug.log('No user found with email:', email);
        throw new Error('User not found');
      }

      const user = result.rows[0];
      const isValid = await verifyPassword(password, user.password_hash?.toString() || '');

      if (!isValid) {
        throw new Error('Invalid password');
      }

      return this.mapUser(user);
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
    let roles: string[];

    try {
      // Handle roles as CSV string
      if (row.roles) {
        roles = row.roles.split(',').map((r: string) => r.trim());
      } else if (row.email === 'patrick@infranet.com') {
        roles = ['role_admin'];

        // Update the database with the correct roles
        db.execute({
          sql: 'UPDATE users SET roles = ? WHERE email = ?',
          args: ['role_admin', row.email]  // Store as simple string
        }).catch(err => console.error('Failed to update admin roles:', err));
      } else {
        roles = ['role_user'];
      }
    } catch (error) {
      console.error('Error parsing roles:', error);
      roles = ['role_user'];
    }

    const createdAt = DateTime.fromSeconds(Number(row.created_at));
    const updatedAt = DateTime.fromSeconds(Number(row.updated_at));

    return {
      id: String(row.id),
      email: String(row.email),
      name: String(row.name),
      roles,
      createdAt,
      updatedAt
    };
  }
}
