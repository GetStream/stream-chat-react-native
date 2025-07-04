import { isDayjs } from 'dayjs';

import type { Duration as DayjsDuration } from 'dayjs/plugin/duration';

import { getDateString } from './getDateString';
import { DurationFormatterOptions, PredefinedFormatters, TimestampFormatterOptions } from './types';

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
};
