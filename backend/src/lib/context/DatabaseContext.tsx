import { createContext, useContext, ReactNode } from 'react';
import { db } from '../db/client';

interface DatabaseContextType {
  db: typeof db;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  db,
  error: null
});

export function DatabaseProvider({ children }: { children: ReactNode }) {
  // Always render children, let individual components handle db errors
  return (
    <DatabaseContext.Provider value={{ db, error: null }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export const useDatabase = () => useContext(DatabaseContext);
