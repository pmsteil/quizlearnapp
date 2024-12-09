import { db } from '../db/core';
import type { DatabaseConfig } from '../types/database';
import { logError } from '../utils/security';

export class DatabaseService {
  constructor(private config: DatabaseConfig) {}

  async initialize() {
    try {
      await db.ensureConnection();
    } catch (error) {
      logError(error, 'DatabaseService.initialize');
      throw error;
    }
  }

  async query(sql: string, args?: any[]) {
    try {
      const result = await db.execute(sql, args);
      return result.rows;
    } catch (error) {
      logError(error, 'DatabaseService.query');
      throw error;
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await db.transaction(callback);
    } catch (error) {
      logError(error, 'DatabaseService.transaction');
      throw error;
    }
  }
}