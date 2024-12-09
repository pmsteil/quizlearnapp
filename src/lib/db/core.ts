import { client } from './client';
import { DatabaseError } from './errors';

export class DatabaseCore {
  private static instance: DatabaseCore;
  private isConnected = false;

  private constructor() {}

  static getInstance(): DatabaseCore {
    if (!DatabaseCore.instance) {
      DatabaseCore.instance = new DatabaseCore();
    }
    return DatabaseCore.instance;
  }

  async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await client.execute('SELECT 1');
        this.isConnected = true;
      } catch (error) {
        throw new DatabaseError('Connection failed', { cause: error });
      }
    }
  }

  async execute(sql: string, args?: any[]) {
    await this.ensureConnection();
    try {
      return await client.execute({ sql, args });
    } catch (error) {
      throw new DatabaseError('Query execution failed', { cause: error });
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.ensureConnection();
    try {
      await this.execute('BEGIN TRANSACTION');
      const result = await callback();
      await this.execute('COMMIT');
      return result;
    } catch (error) {
      await this.execute('ROLLBACK').catch(() => {});
      throw error;
    }
  }
}

export const db = DatabaseCore.getInstance();