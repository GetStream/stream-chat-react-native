import { isDayjs } from 'dayjs';

import type { Duration as DayjsDuration } from 'dayjs/plugin/duration';

import { getDateString } from './getDateString';
import { DurationFormatterOptions, PredefinedFormatters, TimestampFormatterOptions } from './types';

import { isDayOrMoment } from '../../contexts/translationContext/isDayOrMoment';

export const predefinedFormatters: PredefinedFormatters = {
  durationFormatter:
    (streamI18n) =>
    (value, _, { format, withSuffix }: DurationFormatterOptions) => {
      if (format && isDayjs(streamI18n.DateTimeParser)) {
        return (streamI18n.DateTimeParser.duration(value) as DayjsDuration).format(format);
      }
      return streamI18n.DateTimeParser.duration(value).humanize(!!withSuffix);
    },
  timestampFormatter:
    (streamI18n) =>
    (
      value,
      _,
      {
        calendarFormats,
        ...options
      }: Pick<TimestampFormatterOptions, 'calendar' | 'format'> & {
        calendarFormats?: Record<string, string> | string;
      },
    ) => {
      let parsedCalendarFormats;
      try {
        if (!options.calendar) {
          parsedCalendarFormats = {};
        } else if (typeof calendarFormats === 'string') {
          parsedCalendarFormats = JSON.parse(calendarFormats);
        } else if (typeof calendarFormats === 'object') {
          parsedCalendarFormats = calendarFormats;
        }
      } catch (e) {
        console.error('[TIMESTAMP FORMATTER]', e);
      }

      const result = getDateString({
        ...options,
        calendarFormats: parsedCalendarFormats,
        date: value,
        tDateTimeParser: streamI18n.tDateTimeParser,
      });
      if (!result || typeof result === 'number') {
        return JSON.stringify(value);
      }
      return result;
    },
  relativeCompactDateFormatter: (streamI18n) => (value) => {
    if (value === undefined || value === null) {
      return JSON.stringify(value);
    }
    const parsedTime = streamI18n.tDateTimeParser(value);
    const parsedNow = streamI18n.tDateTimeParser();

    if (!isDayOrMoment(parsedTime) || !isDayOrMoment(parsedNow)) {
      return JSON.stringify(value);
    }

    const oneDayInMs = 24 * 60 * 60 * 1000;
    const startOfNowDayMs = parsedNow.startOf('day').valueOf();
    const startOfTimeDayMs = parsedTime.startOf('day').valueOf();
    const daysAgo = Math.floor((startOfNowDayMs - startOfTimeDayMs) / oneDayInMs);

    if (daysAgo <= 0) {
      return 'Today';
    }
    if (daysAgo === 1) {
      return 'Yesterday';
    }
    if (daysAgo <= 6) {
      return `${daysAgo}d ago`;
    }

    const weeksAgo = Math.floor(daysAgo / 7);
    if (weeksAgo <= 3) {
      return `${weeksAgo}w ago`;
    }

    return parsedTime.format('DD/MM/YY');
  },
};
