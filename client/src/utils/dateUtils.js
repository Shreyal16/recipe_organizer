/**
 * Timezone-safe Date arithmetic utility for weekly Monday-to-Sunday scheduling.
 * Strictly uses UTC/calendar-date math to avoid timezone flipping in IST (+05:30) or across midnight.
 */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats a Date object to 'YYYY-MM-DD' in UTC.
 */
export const formatISODate = (d) => {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses 'YYYY-MM-DD' string to a pure UTC Date instance at 00:00:00.000Z.
 */
export const parseISODate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    return getTodayUTC();
  }
  const clean = dateStr.split('T')[0];
  const [year, month, day] = clean.split('-').map(Number);
  if (!year || !month || !day) return getTodayUTC();
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

/**
 * Returns today's calendar date as UTC Date at 00:00:00.000Z.
 */
export const getTodayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
};

/**
 * Calculates Monday of the week for any given date or 'YYYY-MM-DD' string.
 * Returns date-only string 'YYYY-MM-DD'.
 */
export const getMondayString = (inputDate) => {
  const d = inputDate ? parseISODate(inputDate) : getTodayUTC();
  const day = d.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;

  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff, 0, 0, 0, 0));
  return formatISODate(monday);
};

/**
 * Returns the Monday string shifted by n weeks (+1 for next, -1 for previous).
 */
export const shiftWeek = (mondayStr, n = 1) => {
  const monday = parseISODate(mondayStr);
  monday.setUTCDate(monday.getUTCDate() + n * 7);
  return formatISODate(monday);
};

/**
 * Returns an array of 7 day descriptors (Monday to Sunday) for a given week's Monday string.
 */
export const getWeekDays = (mondayStr) => {
  const monday = parseISODate(mondayStr);
  const days = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + i, 0, 0, 0, 0));
    const dateStr = formatISODate(d);
    const monthName = MONTH_NAMES[d.getUTCMonth()];
    const dayOfMonth = d.getUTCDate();

    days.push({
      index: i,
      name: DAY_NAMES[i],
      short: DAY_SHORTS[i],
      dateString: dateStr,
      formattedDate: `${monthName} ${dayOfMonth}`,
      isToday: dateStr === formatISODate(getTodayUTC()),
    });
  }

  return days;
};

/**
 * Formats a human-friendly range, e.g. "Nov 23 - Nov 29, 2026".
 */
export const formatWeekRange = (mondayStr) => {
  const monday = parseISODate(mondayStr);
  const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6, 0, 0, 0, 0));

  const startMonth = MONTH_NAMES[monday.getUTCMonth()];
  const endMonth = MONTH_NAMES[sunday.getUTCMonth()];
  const startDay = monday.getUTCDate();
  const endDay = sunday.getUTCDate();
  const year = sunday.getUTCFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
};

export default {
  formatISODate,
  parseISODate,
  getTodayUTC,
  getMondayString,
  shiftWeek,
  getWeekDays,
  formatWeekRange,
};
