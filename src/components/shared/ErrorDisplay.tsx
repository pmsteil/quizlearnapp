import { ConfigurationError } from '@/lib/config/validate';
import { DatabaseError } from '@/lib/db/client';
import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorDisplayProps {
  error: unknown;
}

// Type guard for DatabaseError
function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError &&
    'title' in error &&
    'message' in error;
}

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }

    return this.props.children;
  }
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  console.error('ErrorDisplay received error:', error);

  if (error instanceof ConfigurationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">Configuration Required</h1>
          <p className="text-center">The application requires configuration to run.</p>
          {error.details && error.details.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Missing Environment Variables:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {error.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm">
                Please check your .env file and ensure these variables are set.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isDatabaseError(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md w-full space-y-4">
          <h1 className="text-2xl font-bold text-center">{error.title}</h1>
          <p className="text-center">{error.message}</p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              To fix this:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Check your .env file</li>
                <li>Ensure database variables are uncommented</li>
                <li>Verify the URL format is correct</li>
              </ol>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Application Error</h1>
        <p className="text-center">
          An unexpected error occurred while starting the application.
        </p>
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">
              {error instanceof Error ? error.stack : String(error)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export { ErrorBoundary };
