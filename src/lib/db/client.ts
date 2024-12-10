import { createClient, LibsqlError } from '@libsql/client';
import { env } from '../config/env';

let dbClient: ReturnType<typeof createClient> | null = null;

export class DatabaseError extends Error {
  constructor(
    public title: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const handleDbError = (error: unknown) => {
  console.error('=== Database Error Details ===');
  console.error('Error:', error);
  console.error('Current DB URL:', env.LIBSQL_DB_URL);
  console.error('Auth Token Set:', !!env.LIBSQL_DB_AUTH_TOKEN);
  console.error('===========================');

  if (error instanceof LibsqlError) {
    console.error('LibSQL Specific Error:', {
      code: error.code,
      message: error.message,
      url: env.LIBSQL_DB_URL
    });

    if (error.code === 'URL_INVALID') {
      const dbError = new DatabaseError(
        'Database Configuration Error',
        'The database URL is not in the correct format. It should start with "libsql://" or "https://".',
        error
      );
      console.error('Throwing formatted error:', dbError);
      throw dbError;
    }
  }

  const dbError = new DatabaseError(
    'Database Error',
    'An unexpected error occurred while connecting to the database. Please try again later.',
    error
  );
  console.error('Throwing generic error:', dbError);
  throw dbError;
};

export const getDb = () => {
  console.log('Getting DB client. Initialized:', !!dbClient);
  if (!dbClient) {
    throw new DatabaseError(
      'Database Not Initialized',
      'Database connection has not been established'
    );
  }
  return dbClient;
};

export const initializeDb = async () => {
  console.log('=== Initializing Database ===');
  console.log('DB URL:', env.LIBSQL_DB_URL);
  console.log('Auth Token Set:', !!env.LIBSQL_DB_AUTH_TOKEN);

  if (!env.LIBSQL_DB_URL || !env.LIBSQL_DB_AUTH_TOKEN) {
    const error = new DatabaseError(
      'Configuration Error',
      'Database configuration is missing. Please check your environment variables.'
    );
    console.error('Configuration error:', error);
    throw error;
  }

  try {
    console.log('Creating client...');
    dbClient = createClient({
      url: env.LIBSQL_DB_URL,
      authToken: env.LIBSQL_DB_AUTH_TOKEN,
    });

    console.log('Testing connection...');
    await dbClient.execute('SELECT 1');
    console.log('Connection test successful');

    return dbClient;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw handleDbError(error);
  }
};

export const db = {
  execute: async (...args: Parameters<ReturnType<typeof createClient>['execute']>) => {
    try {
      return await getDb().execute(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  },
  batch: async (...args: Parameters<ReturnType<typeof createClient>['batch']>) => {
    try {
      return await getDb().batch(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  }
};
