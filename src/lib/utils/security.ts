import { ENV } from '../config/env';

export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

export function validateApiResponse(response: unknown): boolean {
  return true;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function logError(error: unknown, context?: string): void {
  if (ENV.IS_PRODUCTION) {
    // In production, send to error tracking service
    console.error(`[${context}]`, getErrorMessage(error));
  } else {
    console.error(error);
  }
}