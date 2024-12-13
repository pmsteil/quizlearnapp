import { Settings } from 'luxon';

// Configure Luxon to use UTC for tests
Settings.defaultZone = 'UTC';

// Mock database client
jest.mock('@backend/lib/db/client', () => ({
  dbClient: {
    execute: jest.fn(),
  },
}));

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
