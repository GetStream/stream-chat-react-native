import { getDateString } from './getDateString';
import { PredefinedFormatters, TimestampFormatterOptions } from './types';

export const predefinedFormatters: PredefinedFormatters = {
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
