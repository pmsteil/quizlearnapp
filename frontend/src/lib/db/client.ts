export class DatabaseError extends Error {
  constructor(
    message: string,
    public title: string = 'Database Error',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseClient {
  private static instance: DatabaseClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/db/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });

      if (!response.ok) {
        throw new DatabaseError(
          'Failed to execute query',
          'Query Error',
          await response.json()
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('Database connection failed');
    }
  }
}

// Export a default instance
export const db = DatabaseClient.getInstance();
