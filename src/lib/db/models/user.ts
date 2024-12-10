import { db } from '../client';
import type { User } from '@/lib/types';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class UserModel {
  static async create(email: string, password: string, name: string): Promise<User> {
    const passwordHash = await hashPassword(password);
    const now = Math.floor(Date.now() / 1000);

    const result = await db.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [email, email, name, passwordHash, now, now]
    });

    return {
      id: email,
      email,
      name,
      created_at: now,
      updated_at: now
    };
  }

  static async getByEmail(email: string): Promise<User | null> {
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email]
    });

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    return {
      id: user.id as string,
      email: user.email as string,
      name: user.name as string,
      created_at: user.created_at as number,
      updated_at: user.updated_at as number
    };
  }

  static async findByEmail(email: string): Promise<User | null> {
    return this.getByEmail(email);
  }

  static async verifyPassword(email: string, password: string): Promise<boolean> {
    const result = await db.execute({
      sql: 'SELECT password_hash FROM users WHERE email = ?',
      args: [email]
    });

    if (result.rows.length === 0) {
      return false;
    }

    const passwordHash = await hashPassword(password);
    return passwordHash === result.rows[0].password_hash;
  }

  static async authenticate(email: string, password: string): Promise<User> {
    const isValid = await this.verifyPassword(email, password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const user = await this.getByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
