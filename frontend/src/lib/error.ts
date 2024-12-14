export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode: string = 'UNKNOWN_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }

  toString(): string {
    if (typeof this.message === 'object') {
      return JSON.stringify(this.message);
    }
    return this.message;
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, 500, 'UNKNOWN_ERROR');
  }

  return new AppError('An unknown error occurred', 500, 'UNKNOWN_ERROR');
}
