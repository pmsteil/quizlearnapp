import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { db, initializeDatabase, testConnection } from '../db/client';
import { useToast } from '@/hooks/use-toast';

interface DatabaseContextType {
  isConnected: boolean;
  isInitializing: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        // Test connection and initialize schema
        const connected = await testConnection();
        if (!connected) {
          throw new Error('Database connection failed');
        }
        
        setIsConnected(true);
        setError(null);
        console.log('Database initialized and connected successfully');
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize database'));
        toast({
          title: "Database Error",
          description: "Failed to connect to the database. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [toast]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Initializing...</h2>
          <p className="text-muted-foreground">Setting up your learning environment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive mb-2">Connection Error</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ 
      isConnected, 
      isInitializing,
      error 
    }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}