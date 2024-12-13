import { DateTime } from 'luxon';

export function fromUnixTimestamp(timestamp: number): DateTime {
  return DateTime.fromSeconds(timestamp);
}

export function toUnixTimestamp(dateTime: DateTime): number {
  return Math.floor(dateTime.toSeconds());
}

export function now(): DateTime {
  return DateTime.now();
}

export function fromJSDate(date: Date): DateTime {
  return DateTime.fromJSDate(date);
}

export function toJSDate(dateTime: DateTime): Date {
  return dateTime.toJSDate();
}
