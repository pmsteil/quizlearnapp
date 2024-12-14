import { Settings } from 'luxon';
import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.join(process.cwd(), '.env.test') });

// Configure Luxon to use UTC for tests
Settings.defaultZone = 'UTC';

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
