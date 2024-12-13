import { ReactNode } from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import { DatabaseProvider } from '../context/DatabaseContext';
import { AuthProvider } from '../context/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="quiz-learn-theme">
      <DatabaseProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}