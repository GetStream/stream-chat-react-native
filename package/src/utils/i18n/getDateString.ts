import type { TranslationLanguages } from 'stream-chat';

import { calendarFormats } from './calendarFormats';
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

type DateStringForA11yOptions = {
  /**
   * Optional calendar-format overrides applied on top of the locale defaults
   * and the SDK's `sameElse: 'LL'` substitution. Use this when the visible
   * date format diverges from the locale defaults (e.g. ChannelPreviewStatus
   * uses `sameDay: 'LT'` to show the time instead of "Today").
   */
  calendarFormatOverrides?: Partial<{
    lastDay: string;
    lastWeek: string;
    nextDay: string;
    nextWeek: string;
    sameDay: string;
    sameElse: string;
  }>;
  date?: string | Date;
  tDateTimeParser?: TranslatorFunctions['tDateTimeParser'];
  userLanguage?: TranslationLanguages;
};

/**
 * Produce a TTS-friendly calendar string. iOS VoiceOver reads numeric dates
 * like "04/08/2026" character-by-character; substituting `LL` ("April 8, 2026")
 * for the calendar `sameElse` slot fixes that. The relative slots
 * (sameDay/lastDay/nextDay/lastWeek/nextWeek) are preserved from the locale,
 * so "Today"/"Yesterday"/weekday names still come through.
 */
export const getDateStringForA11y = ({
  calendarFormatOverrides,
  date,
  tDateTimeParser,
  userLanguage,
}: DateStringForA11yOptions): string | undefined => {
  if (!date || (typeof date === 'string' && !Date.parse(date))) {
    return undefined;
  }
  if (!tDateTimeParser) {
    return undefined;
  }

  const parsedTime = tDateTimeParser(date);
  if (!isDayOrMoment(parsedTime) || !parsedTime.calendar) {
    return undefined;
  }

  const localeFormats = (userLanguage && calendarFormats[userLanguage]) || calendarFormats.en;

  return parsedTime.calendar(undefined, {
    ...localeFormats,
    sameElse: 'LL',
    ...calendarFormatOverrides,
  });
};
