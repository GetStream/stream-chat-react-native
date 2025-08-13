import { TimestampFormatterOptions } from './types';

import { TranslatorFunctions } from '../../contexts/translationContext';
import { isDayOrMoment } from '../../contexts/translationContext/isDayOrMoment';

type DateFormatterOptions = TimestampFormatterOptions &
  Partial<TranslatorFunctions> & {
    /**
     * The timestamp to be formatted.
     */
    date?: string | Date;
    /*
     * Lookup key in the language corresponding translations sheet to perform date formatting
     */
    timestampTranslationKey?: string;
  };

export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';

/**
 * Utility function to format the date string.
 */
export function getDateString({
  calendar,
  calendarFormats,
  date,
  format,
  t,
  tDateTimeParser,
  timestampTranslationKey,
}: DateFormatterOptions): string | number | undefined {
  if (!date || (typeof date === 'string' && !Date.parse(date))) {
    return;
  }

  if (!tDateTimeParser) {
    console.log(noParsingFunctionWarning);
    return;
  }

  if (t && timestampTranslationKey) {
    const options: TimestampFormatterOptions = {};
    if (typeof calendar !== 'undefined' && calendar !== null) {
      options.calendar = calendar;
    }
    if (typeof calendarFormats !== 'undefined' && calendarFormats !== null) {
      options.calendarFormats = calendarFormats;
    }
    if (typeof format !== 'undefined' && format !== null) {
      options.format = format;
    }
    const translatedTimestamp = t(timestampTranslationKey, {
      ...options,
      timestamp: new Date(date),
    });
    const translationKeyFound = timestampTranslationKey !== translatedTimestamp;
    if (translationKeyFound) {
      return translatedTimestamp;
    }
  }

  const parsedTime = tDateTimeParser(date);

  if (isDayOrMoment(parsedTime)) {
    /**
     * parsedTime.calendar is guaranteed on the type but is only
     * available when a user calls dayjs.extend(calendar)
     */
    return calendar && parsedTime.calendar
      ? parsedTime.calendar(undefined, calendarFormats)
      : parsedTime.format(format);
  }

  return new Date(date).toDateString();
}
