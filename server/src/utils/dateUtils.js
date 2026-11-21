/**
 * Date utility functions for consistent Monday-to-Sunday weekly scheduling in UTC.
 */

/**
 * Returns the Date object corresponding to Monday 00:00:00.000 UTC for the given date.
 * If input is invalid, throws a descriptive error.
 */
export const getMondayUTC = (inputDate) => {
  const d = new Date(inputDate);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided for week normalization');
  }

  // Get current day of week in UTC (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const day = d.getUTCDay();
  // Calculate difference to Monday (Monday is 1, so if day is 0 (Sun), diff is -6; if day is 1 (Mon), diff is 0; etc.)
  const diff = day === 0 ? -6 : 1 - day;

  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff, 0, 0, 0, 0));
  return monday;
};

/**
 * Formats a Date object to YYYY-MM-DD UTC string.
 */
export const formatISODate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Returns an array of 7 Date objects (Monday to Sunday) starting from the given Monday UTC.
 */
export const getWeekDatesUTC = (mondayDate) => {
  const monday = getMondayUTC(mondayDate);
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
    weekDays.push(day);
  }
  return weekDays;
};

export default {
  getMondayUTC,
  formatISODate,
  getWeekDatesUTC,
};
