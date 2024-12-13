import { db } from './client';

export async function query(sql: string, params: any[] = []) {
  try {
    const result = await db.execute({
      sql,
      args: params
    });
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  try {
    await db.execute({ sql: 'BEGIN', args: [] });
    const result = await callback();
    await db.execute({ sql: 'COMMIT', args: [] });
    return result;
  } catch (error) {
    await db.execute({ sql: 'ROLLBACK', args: [] });
    throw error;
  }
}
