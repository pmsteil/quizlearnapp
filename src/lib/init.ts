import { validateConfig } from './config/validator';
import { initializeDb, db, DatabaseError } from './db/client';

export async function initializeApp() {
  console.log('=== Starting App Initialization ===');

  try {
    console.log('Validating configuration...');
    const config = validateConfig();
    if (!config.isValid) {
      console.error('Configuration validation failed:', config.error);
      throw new Error(`Configuration Error: ${config.error?.message}\nMissing: ${config.error?.details}`);
    }
    console.log('Configuration valid');

    console.log('Initializing database...');
    await initializeDb();
    console.log('Database initialized successfully');

    return {
      db,
    };
  } catch (error) {
    console.error('=== Initialization Failed ===');
    console.error('Error:', error);
    if (error instanceof DatabaseError) {
      throw error;
    }
    throw new Error(error instanceof Error ? error.message : 'Unknown initialization error');
  }
}
