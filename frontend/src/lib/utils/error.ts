import { ApiError } from '../api';
import { logger } from './logger';

export class AppError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'APP_ERROR', details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'code' in error && 'message' in error;
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (isApiError(error)) {
    return new AppError(error.message, error.code, error.details);
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unexpected error occurred');
}

export function getErrorMessage(error: unknown): string {
  const appError = handleError(error);
  return appError.message;
}

export function logError(error: unknown, context?: string) {
  const appError = handleError(error);
  logger.error(
    context ? `${context}: ${appError.message}` : appError.message,
    appError
  );
  return appError;
}
