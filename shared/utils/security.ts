export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function logError(error: unknown, context: string) {
  if (import.meta.env.PROD) {
    // In production, send to error tracking service
    console.error(`[${context}]`, getErrorMessage(error));
  } else {
    console.error(`[${context}] Error:`, error);
  }
}
