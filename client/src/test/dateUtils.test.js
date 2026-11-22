import { describe, it, expect } from 'vitest';
import {
  formatISODate,
  parseISODate,
  getMondayString,
  shiftWeek,
  getWeekDays,
  formatWeekRange,
} from '../utils/dateUtils';

describe('Client dateUtils Pure Utilities Suite', () => {
  it('formats dates consistently to UTC YYYY-MM-DD string', () => {
    const d = new Date(Date.UTC(2026, 10, 23, 14, 30, 0));
    expect(formatISODate(d)).toBe('2026-11-23');
  });

  it('parses ISO date strings and handles fallback for invalid inputs', () => {
    const parsed = parseISODate('2026-11-23');
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(10); // Nov is 10
    expect(parsed.getUTCDate()).toBe(23);

    // Invalid/empty fallback
    const fallbackNull = parseISODate(null);
    expect(fallbackNull).toBeInstanceOf(Date);

    const fallbackEmpty = parseISODate('');
    expect(fallbackEmpty).toBeInstanceOf(Date);

    const fallbackMalformed = parseISODate('not-a-date');
    expect(fallbackMalformed).toBeInstanceOf(Date);
  });

  it('accurately calculates Monday for any given date within a week', () => {
    // 2026-11-23 is Monday
    expect(getMondayString('2026-11-23')).toBe('2026-11-23');
    // 2026-11-25 is Wednesday -> Monday is 2026-11-23
    expect(getMondayString('2026-11-25')).toBe('2026-11-23');
    // 2026-11-29 is Sunday -> Monday is 2026-11-23
    expect(getMondayString('2026-11-29')).toBe('2026-11-23');
  });

  it('shifts weeks correctly forward and backward', () => {
    expect(shiftWeek('2026-11-23', 1)).toBe('2026-11-30');
    expect(shiftWeek('2026-11-23', -1)).toBe('2026-11-16');
    expect(shiftWeek('2026-11-23', 2)).toBe('2026-12-07');
  });

  it('generates 7 day descriptors from Monday to Sunday', () => {
    const days = getWeekDays('2026-11-23');
    expect(days.length).toBe(7);

    expect(days[0].name).toBe('Monday');
    expect(days[0].dateString).toBe('2026-11-23');
    expect(days[6].name).toBe('Sunday');
    expect(days[6].dateString).toBe('2026-11-29');
  });

  it('formats human-friendly week ranges for same-month and cross-month weeks', () => {
    // Same month
    expect(formatWeekRange('2026-11-23')).toBe('Nov 23 - 29, 2026');
    // Cross month: Nov 30 to Dec 6
    expect(formatWeekRange('2026-11-30')).toBe('Nov 30 - Dec 6, 2026');
  });
});
