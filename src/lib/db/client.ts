import { createClient, LibsqlError } from '@libsql/client';

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
  console.error('Current DB URL:', import.meta.env.VITE_LIBSQL_DB_URL);
  console.error('Auth Token Set:', !!import.meta.env.VITE_LIBSQL_DB_AUTH_TOKEN);
  console.error('===========================');

  if (error instanceof LibsqlError) {
    if (error.code === 'URL_INVALID') {
      throw new DatabaseError(
        'Database Configuration Error',
        'The database URL is not in the correct format.',
        error
      );
    }
  }

  throw new DatabaseError(
    'Database Error',
    'An unexpected error occurred while connecting to the database.',
    error
  );
};

// Create a single client instance with build-time environment variables
export const db = createClient({
  url: import.meta.env.VITE_LIBSQL_DB_URL,
  authToken: import.meta.env.VITE_LIBSQL_DB_AUTH_TOKEN
});

// Wrap the client methods to handle errors consistently
export const dbClient = {
  execute: async (...args: Parameters<typeof db.execute>) => {
    try {
      return await db.execute(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  },
  batch: async (...args: Parameters<typeof db.batch>) => {
    try {
      return await db.batch(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  }
};

// Initialize database connection
export const initializeDb = async () => {
  try {
    console.log('Testing database connection...');
    await dbClient.execute('SELECT 1');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw handleDbError(error);
  }
};
