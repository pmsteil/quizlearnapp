import { useToast } from '@/hooks/use-toast';

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class TopicError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'TopicError';
  }
}

export function handleError(error: unknown): string {
  if (error instanceof DatabaseError) {
    return `Database error: ${error.message}`;
  }
  if (error instanceof TopicError) {
    return `Topic error: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function useErrorToast() {
  const { toast } = useToast();
  
  return (error: unknown) => {
    const message = handleError(error);
    toast({
      title: "Error",
      description: message,
      variant: "destructive"
    });
  };
}