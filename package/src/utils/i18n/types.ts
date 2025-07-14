import { Streami18n } from './Streami18n';

export type FormatterFactory<V> = (
  streamI18n: Streami18n,
) => (value: V, lng: string | undefined, options: Record<string, unknown>) => string;

// Here is any used, because we do not want to enforce any specific rules and
// want to leave the type declaration to the integrator
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
export type CustomFormatters = Record<string, FormatterFactory<any>>;

/**
 * import dayjs from 'dayjs';
 * import duration from 'dayjs/plugin/duration';
 *
 * dayjs.extend(duration);
 *
 * // Basic formatting
 * dayjs.duration(1000).format('HH:mm:ss'); // "00:00:01"
 * dayjs.duration(3661000).format('HH:mm:ss'); // "01:01:01"
 *
 * // Different format tokens
 * dayjs.duration(3661000).format('D[d] H[h] m[m] s[s]'); // "0d 1h 1m 1s"
 * dayjs.duration(3661000).format('D [days] H [hours] m [minutes] s [seconds]'); // "0 days 1 hours 1 minutes 1 seconds"
 *
 * // Zero padding
 * dayjs.duration(1000).format('HH:mm:ss'); // "00:00:01"
 * dayjs.duration(1000).format('H:m:s'); // "0:0:1"
 *
 * // Different units
 * dayjs.duration(3661000).format('D'); // "0"
 * dayjs.duration(3661000).format('H'); // "1"
 * dayjs.duration(3661000).format('m'); // "1"
 * dayjs.duration(3661000).format('s'); // "1"
 *
 * // Complex examples
 * dayjs.duration(3661000).format('DD:HH:mm:ss'); // "00:01:01:01"
 * dayjs.duration(3661000).format('D [days] HH:mm:ss'); // "0 days 01:01:01"
 * dayjs.duration(3661000).format('H[h] m[m] s[s]'); // "1h 1m 1s"
 *
 * // Negative durations
 * dayjs.duration(-3661000).format('HH:mm:ss'); // "-01:01:01"
 *
 * // Long durations
 * dayjs.duration(86400000).format('D [days]'); // "1 days"
 * dayjs.duration(2592000000).format('M [months]'); // "30 months"
 *
 *
 * Format tokens:
 * D - days
 * H - hours
 * m - minutes
 * s - seconds
 * S - milliseconds
 * M - months
 * Y - years
 * You can also use:
 * HH, mm, ss for zero-padded numbers
 * [text] for literal text
 */
export type DurationFormatterOptions = {
  format?: string;
  withSuffix?: boolean;
};

export type TimestampFormatterOptions = {
  /* If true, call the `Day.js` calendar function to get the date string to display (e.g. "Yesterday at 3:58 PM"). */
  calendar?: boolean | null;
  /* Object specifying date display formats for dates formatted with calendar extension. Active only if calendar prop enabled. */
  calendarFormats?: Record<string, string>;
  /* Overrides the default timestamp format if calendar is disabled. */
  format?: string;
  /* If true, the formatter will return a humanized string with suffix (e.g. "in 5 minutes" or "5 minutes ago"). */
  withSuffix?: boolean;
};

export type PredefinedFormatters = {
  durationFormatter: FormatterFactory<string>;
  timestampFormatter: FormatterFactory<string | Date>;
};
