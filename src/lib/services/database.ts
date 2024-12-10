import { logError } from '../utils/security';
import { query, transaction } from '../db/core';

export class DatabaseService {
  async query(sql: string, args?: any[]) {
    try {
      return await query(sql, args || []);
    } catch (error) {
      logError(error, 'DatabaseService.query');
      throw error;
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await transaction(callback);
    } catch (error) {
      logError(error, 'DatabaseService.transaction');
      throw error;
    }
  }
}
