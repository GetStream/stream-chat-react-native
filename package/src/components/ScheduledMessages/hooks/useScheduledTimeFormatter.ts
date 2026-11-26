import { useCallback } from 'react';

import { useTranslationContext } from '../../../contexts/translationContext/TranslationContext';
import type { TDateTimeParser } from '../../../contexts/translationContext/types';
import { isDayOrMoment } from '../../../i18n/utils';
import { isSameLocalDay } from '../utils/scheduleTime';

/** Formats `date` with a Day.js/Moment template through the app's date parser. */
export const formatWithParser = (
  tDateTimeParser: TDateTimeParser,
  date: Date,
  template: string,
) => {
  const parsed = tDateTimeParser(date);
  return isDayOrMoment(parsed) ? parsed.format(template) : date.toLocaleString();
};

/**
 * Formatters for the times shown around scheduled messages, such as `Fri, Oct 23 at 09:00` and
 * `Tomorrow at 09:00`.
 */
export const useScheduledTimeFormatter = () => {
  const { t, tDateTimeParser } = useTranslationContext();

  const formatTime = useCallback(
    (date: Date) => formatWithParser(tDateTimeParser, date, 'LT'),
    [tDateTimeParser],
  );

  const formatDateTime = useCallback(
    (date: Date) =>
      t('scheduledMessages.dateTime.label', '{{ day }} at {{ time }}', {
        day: formatWithParser(tDateTimeParser, date, 'ddd, MMM D'),
        time: formatTime(date),
      }),
    [formatTime, t, tDateTimeParser],
  );

  const formatPreset = useCallback(
    (date: Date, now: Date) => {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);

      if (isSameLocalDay(date, tomorrow)) {
        return t('scheduledMessages.preset.tomorrow.label', 'Tomorrow at {{ time }}', {
          time: formatTime(date),
        });
      }

      return t('scheduledMessages.preset.weekday.label', '{{ day }} at {{ time }}', {
        day: formatWithParser(tDateTimeParser, date, 'dddd'),
        time: formatTime(date),
      });
    },
    [formatTime, t, tDateTimeParser],
  );

  return { formatDateTime, formatPreset, formatTime };
};
