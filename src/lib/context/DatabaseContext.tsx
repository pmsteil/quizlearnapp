import { createContext, useContext, ReactNode, useEffect } from 'react';
import { createClient } from '@libsql/client';

const dbClient = createClient({
  url: import.meta.env.VITE_DATABASE_URL as string,
  authToken: import.meta.env.VITE_DATABASE_TOKEN as string,
});

interface DatabaseContextType {
  client: typeof dbClient;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing database connection...');
        await dbClient.execute('SELECT 1');
        console.log('Database connection successful');
      } catch (error) {
        console.error('Database connection failed:', error);
      }
    };

    testConnection();
  }, []);

  console.log('DatabaseProvider rendering with client:', !!dbClient);

  return (
    <DatabaseContext.Provider value={{ client: dbClient }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
