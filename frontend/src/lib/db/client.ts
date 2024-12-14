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
    // Use the same base URL as the auth service
    this.baseUrl = 'http://localhost:3000/api/v1';
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    try {
      const tokenData = localStorage.getItem('auth_token_data');
      const token = tokenData ? JSON.parse(tokenData).access_token : null;

      if (!token) {
        throw new DatabaseError('Not authenticated');
      }

      console.log('Executing query:', { sql, params });
      const response = await fetch(`${this.baseUrl}/admin/db/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sql, params }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Query error:', error);
        throw new DatabaseError(
          error.message || 'Failed to execute query',
          'Query Error',
          error
        );
      }

      const data = await response.json();
      console.log('Query response:', data);
      return data;
    } catch (error) {
      console.error('Database query error:', error);
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        error instanceof Error ? error.message : 'Database connection failed'
      );
    }
  }
}

// Export a default instance
export const db = DatabaseClient.getInstance();
