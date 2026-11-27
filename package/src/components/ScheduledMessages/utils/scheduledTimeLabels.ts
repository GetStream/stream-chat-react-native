import { isSameLocalDay } from './scheduleTime';

import type { TranslationContextValue } from '../../../contexts/translationContext/TranslationContext';
import { getDateString } from '../../../i18n/utils';

/** The translation functions the scheduled time labels are resolved with. */
export type ScheduledTimeTranslators = Pick<TranslationContextValue, 't' | 'tDateTimeParser'>;

const formatWithKey = ({
  date,
  t,
  tDateTimeParser,
  timestampTranslationKey,
}: ScheduledTimeTranslators & { date: Date; timestampTranslationKey: string }) =>
  String(
    getDateString({ messageCreatedAt: date, t, tDateTimeParser, timestampTranslationKey }) ?? '',
  );

/**
 * Formats the time of a scheduled message with the `timestamp.ScheduledMessageTime` translation,
 * which defaults to the 24 hour `HH:mm` format of the design.
 */
export const formatScheduledTime = (date: Date, translators: ScheduledTimeTranslators) =>
  formatWithKey({
    ...translators,
    date,
    timestampTranslationKey: 'timestamp.ScheduledMessageTime',
  });

/** Formats the day of a scheduled message with the `timestamp.ScheduledMessageDate` translation. */
export const formatScheduledDate = (date: Date, translators: ScheduledTimeTranslators) =>
  formatWithKey({
    ...translators,
    date,
    timestampTranslationKey: 'timestamp.ScheduledMessageDate',
  });

/** Formats a scheduled send time such as `Fri, Oct 23 at 09:00`. */
export const formatScheduledDateTime = (date: Date, translators: ScheduledTimeTranslators) =>
  translators.t('scheduledMessages.dateTime.label', '{{ day }} at {{ time }}', {
    day: formatScheduledDate(date, translators),
    time: formatScheduledTime(date, translators),
  });

/** Formats a quick schedule option such as `Tomorrow at 09:00` or `Monday at 09:00`. */
export const formatSchedulePreset = (
  date: Date,
  now: Date,
  translators: ScheduledTimeTranslators,
) => {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const time = formatScheduledTime(date, translators);

  if (isSameLocalDay(date, tomorrow)) {
    return translators.t('scheduledMessages.preset.tomorrow.label', 'Tomorrow at {{ time }}', {
      time,
    });
  }

  return translators.t('scheduledMessages.preset.weekday.label', '{{ day }} at {{ time }}', {
    day: formatWithKey({
      ...translators,
      date,
      timestampTranslationKey: 'timestamp.ScheduledMessageWeekday',
    }),
    time,
  });
};
