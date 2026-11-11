const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY_MS = 24 * 60 * 60 * 1000;

const twoDigits = (value: number) => String(value).padStart(2, '0');

/**
 * A short label for a point on a time axis: the time of day when the chart spans a day or less,
 * such as `13:45`, and otherwise the day and month, such as `29 Oct`. A date written out in full
 * doesn't fit under a point. Anything that isn't a date is labelled as it is.
 */
export const formatTimeLabel = (value: unknown, spanMs: number): string => {
  const date =
    value instanceof Date ? value : typeof value === 'number' ? new Date(value) : undefined;
  if (!date || Number.isNaN(date.getTime())) return String(value ?? '');
  if (spanMs <= DAY_MS) return `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
};
