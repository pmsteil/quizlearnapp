import { createClient, LibsqlError } from '@libsql/client';
import path from 'path';

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
  console.log('Validating DB URL:', url);

  if (!url) {
    throw new DatabaseError(
      'Database Configuration Error',
      'Database URL is missing. Please check your environment variables.',
      { url }
    );
  }
}

let dbInstance: ReturnType<typeof createClient> | null = null;

function getDbClient() {
  if (!dbInstance) {
    // Use local SQLite database
    const dbPath = path.resolve(process.cwd(), 'data/db/quizlearn.db');
    const url = `file:${dbPath}`;
    console.log('Using local database at:', dbPath);

    validateDbUrl(url);

    dbInstance = createClient({
      url
    });
  }
  return dbInstance;
}

// Wrap the client methods to handle errors consistently
export const dbClient = {
  async execute(...args: Parameters<ReturnType<typeof createClient>['execute']>) {
    try {
      return await getDbClient().execute(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  },

  async batch(...args: Parameters<ReturnType<typeof createClient>['batch']>) {
    try {
      return await getDbClient().batch(...args);
    } catch (error) {
      throw handleDbError(error);
    }
  }
};

function handleDbError(error: unknown) {
  console.error('=== Database Error Details ===');
  console.error(error);

  if (error instanceof LibsqlError) {
    switch (error.code) {
      case 'SQLITE_CONSTRAINT':
        return new DatabaseError(
          'Constraint Violation',
          'A database constraint was violated. This usually means a unique value already exists.',
          error
        );
      default:
        return new DatabaseError(
          'Database Error',
          'An error occurred while accessing the database.',
          error
        );
    }
  }

  return error;
}

// Initialize database connection
export async function initializeDb() {
  try {
    await dbClient.execute({ sql: 'SELECT 1', args: [] });
    console.log('Database connection initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw error;
  }
}

// For backward compatibility
export const db = dbClient;
