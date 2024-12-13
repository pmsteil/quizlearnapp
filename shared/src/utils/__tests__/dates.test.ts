import { DateTime } from 'luxon';
import * as dateUtils from '../dates';

describe('dateUtils', () => {
  describe('fromUnixTimestamp', () => {
    it('should convert Unix timestamp to DateTime', () => {
      const timestamp = 1609459200; // 2021-01-01 00:00:00 UTC
      const result = dateUtils.fromUnixTimestamp(timestamp);

      expect(result.toISO()).toBe('2021-01-01T00:00:00.000Z');
      expect(result instanceof DateTime).toBe(true);
    });
  });

  describe('toUnixTimestamp', () => {
    it('should convert DateTime to Unix timestamp', () => {
      const dt = DateTime.fromISO('2021-01-01T00:00:00.000Z');
      const result = dateUtils.toUnixTimestamp(dt);

      expect(result).toBe(1609459200);
    });
  });

  describe('now', () => {
    it('should return current DateTime', () => {
      const result = dateUtils.now();
      const currentTimestamp = Math.floor(Date.now() / 1000);

      expect(result instanceof DateTime).toBe(true);
      expect(dateUtils.toUnixTimestamp(result)).toBeWithinRange(
        currentTimestamp - 1,
        currentTimestamp + 1
      );
    });
  });

  describe('fromJSDate', () => {
    it('should convert JS Date to DateTime', () => {
      const date = new Date('2021-01-01T00:00:00.000Z');
      const result = dateUtils.fromJSDate(date);

      expect(result.toISO()).toBe('2021-01-01T00:00:00.000Z');
      expect(result instanceof DateTime).toBe(true);
    });
  });

  describe('toJSDate', () => {
    it('should convert DateTime to JS Date', () => {
      const dt = DateTime.fromISO('2021-01-01T00:00:00.000Z');
      const result = dateUtils.toJSDate(dt);

      expect(result instanceof Date).toBe(true);
      expect(result.toISOString()).toBe('2021-01-01T00:00:00.000Z');
    });
  });
});
