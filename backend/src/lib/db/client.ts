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

// Validate URL format before creating client
function validateDbUrl(url: string | undefined) {
  console.log('Validating DB URL:', url?.substring(0, 8) + '...');

  if (!url) {
    throw new DatabaseError(
      'Database Configuration Error',
      'Database URL is missing. Please check your environment variables.',
      { url }
    );
  }

  if (!url.startsWith('https://')) {
    throw new DatabaseError(
      'Database Configuration Error',
      'Database URL must start with https://',
      { url: url.substring(0, 8) + '...' }
    );
  }
}

let dbInstance: ReturnType<typeof createClient> | null = null;

function getDbClient() {
  if (!dbInstance) {
    // Try runtime config first, fall back to build-time env vars
    const url = import.meta.env.VITE_LIBSQL_DB_URL;
    const authToken = import.meta.env.VITE_LIBSQL_DB_AUTH_TOKEN;

    validateDbUrl(url);

    if (!authToken) {
      throw new DatabaseError(
        'Database Configuration Error',
        'Database auth token is missing. Please check your environment variables.'
      );
    }

    dbInstance = createClient({
      url,
      authToken
    });
  }
  return dbInstance;
}

// Wrap the client methods to handle errors consistently
export const dbClient = {
  execute: async (...args: Parameters<ReturnType<typeof createClient>['execute']>) => {
    try {
      const client = getDbClient();
      return await client.execute(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  },
  batch: async (...args: Parameters<ReturnType<typeof createClient>['batch']>) => {
    try {
      const client = getDbClient();
      return await client.batch(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  }
};

export const handleDbError = (error: unknown) => {
  console.error('=== Database Error Details ===');
  console.error('Error:', error);
  console.error('Current DB URL:', import.meta.env.VITE_LIBSQL_DB_URL?.substring(0, 8) + '...');
  console.error('Auth Token Set:', !!import.meta.env.VITE_LIBSQL_DB_AUTH_TOKEN);
  console.error('===========================');

  if (error instanceof LibsqlError) {
    if (error.code === 'URL_INVALID') {
      throw new DatabaseError(
        'Database Configuration Error',
        'The database URL is not in the correct format. It should start with "https://".',
        error
      );
    }
  }

  if (error instanceof DatabaseError) {
    throw error;
  }

  throw new DatabaseError(
    'Database Error',
    'An unexpected error occurred while connecting to the database.',
    error
  );
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

// For backward compatibility
export const db = dbClient;
