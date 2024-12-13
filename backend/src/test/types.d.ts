declare namespace jest {
  interface Matchers<R> {
    toBeWithinRange(floor: number, ceiling: number): R;
  }
}

declare module '@backend/lib/db/client' {
  export const dbClient: {
    execute: jest.Mock;
  };
}
