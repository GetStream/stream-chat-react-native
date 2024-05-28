import {
  isDayOrMoment,
  TDateTimeParser,
  TDateTimeParserInput,
} from '../contexts/translationContext/TranslationContext';

interface DateFormatterOptions {
  /**
   * Whether to show the time in Calendar time format. Calendar time displays time relative to a today's date.
   */
  calendar?: boolean;
  /**
   * The timestamp to be formatted.
   */
  date?: string | Date;
  /**
   * The format in which the date should be displayed.
   */
  format?: string;
  /**
   * A function to format the date.
   */
  formatDate?: (date: TDateTimeParserInput) => string;
  /**
   * The datetime parsing function.
   */
  tDateTimeParser?: TDateTimeParser;
}

export const noParsingFunctionWarning =
  'MessageTimestamp was called but there is no datetime parsing function available';

/**
 * Utility funcyion to format the date string.
 */
export function getDateString({
  calendar,
  date,
  format,
  formatDate,
  tDateTimeParser,
}: DateFormatterOptions): string | Date | undefined {
  if (!date || (typeof date === 'string' && !Date.parse(date))) {
    return;
  }

  if (typeof formatDate === 'function') {
    return formatDate(new Date(date));
  }

  if (!tDateTimeParser) {
    console.log(noParsingFunctionWarning);
    return;
  }

  const parsedTime = tDateTimeParser(date);

  if (isDayOrMoment(parsedTime)) {
    /**
     * parsedTime.calendar is guaranteed on the type but is only
     * available when a user calls dayjs.extend(calendar)
     */
    return calendar && parsedTime.calendar ? parsedTime.calendar() : parsedTime.format(format);
  }

  return new Date(date).toDateString();
}
