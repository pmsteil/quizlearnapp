import React, { createContext, useContext, useState } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  isLoading: (key: string) => boolean;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  clearLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const isLoading = (key: string) => !!loadingStates[key];

  const startLoading = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  };

  const stopLoading = (key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  };

  const clearLoading = () => {
    setLoadingStates({});
  };

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, clearLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
