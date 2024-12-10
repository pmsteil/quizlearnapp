export class DatabaseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'DatabaseError';
  }
}
