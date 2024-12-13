import { useEffect, useState } from 'react';
import { validateConfig } from '@/lib/config/validate';
import { ErrorDisplay } from '@/components/shared/ErrorDisplay';

interface InitializationWrapperProps {
  children: React.ReactNode;
}

export function InitializationWrapper({ children }: InitializationWrapperProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        console.log('[InitializationWrapper] Starting initialization...');

        // Add defensive check for window and import.meta
        if (typeof window === 'undefined' || !import.meta?.env) {
          throw new Error('Environment is not properly initialized');
        }

        console.log('[InitializationWrapper] Environment check:', {
          hasWindow: typeof window !== 'undefined',
          hasImportMeta: !!import.meta,
          hasEnv: !!import.meta.env,
        });

        validateConfig();

        if (isMounted) {
          console.log('[InitializationWrapper] Initialization successful');
          setIsInitialized(true);
          setIsInitializing(false);
        }
      } catch (err) {
        console.error('[InitializationWrapper] Initialization failed:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsInitializing(false);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show error state
  if (error) {
    console.log('[InitializationWrapper] Rendering error state');
    return <ErrorDisplay error={error} />;
  }

  // Show loading state
  if (isInitializing || !isInitialized) {
    console.log('[InitializationWrapper] Rendering loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  // Show main content
  console.log('[InitializationWrapper] Rendering main content');
  return <>{children}</>;
}
