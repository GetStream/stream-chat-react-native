import type { Channel } from 'stream-chat';
import { getScheduledMessageLimits } from 'stream-chat';

export const SCHEDULE_PRESET_HOURS = { afternoon: 13, morning: 9 } as const;

export type ScheduleTimeBounds = {
  /** The earliest time the server accepts. */
  earliest: Date;
  /** The latest time the server accepts, when the app sets a maximum lead time. */
  latest?: Date;
};

export type ScheduleTimeError = 'too_soon' | 'too_far';

/** Returns `date` moved by `dayOffset` days, at `hour`:00 in the device's time zone. */
export const getLocalDateAtHour = (date: Date, dayOffset: number, hour: number) => {
  const localDate = new Date(date);
  localDate.setDate(date.getDate() + dayOffset);
  localDate.setHours(hour, 0, 0, 0);
  return localDate;
};

export const getDaysUntilNextMonday = (date: Date) => {
  const daysUntilMonday = (7 - date.getDay() + 1) % 7;
  return daysUntilMonday || 7;
};

export const isSameLocalDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Tomorrow morning, tomorrow afternoon and next Monday morning, unless Monday is tomorrow. */
export const getSchedulePresets = (now: Date) => {
  const tomorrowMorning = getLocalDateAtHour(now, 1, SCHEDULE_PRESET_HOURS.morning);
  const tomorrowAfternoon = getLocalDateAtHour(now, 1, SCHEDULE_PRESET_HOURS.afternoon);
  const nextMondayMorning = getLocalDateAtHour(
    now,
    getDaysUntilNextMonday(now),
    SCHEDULE_PRESET_HOURS.morning,
  );

  return isSameLocalDay(nextMondayMorning, tomorrowMorning)
    ? [tomorrowMorning, tomorrowAfternoon]
    : [tomorrowMorning, tomorrowAfternoon, nextMondayMorning];
};

export const getScheduleTimeBounds = (channel: Channel, now: Date): ScheduleTimeBounds => {
  const { maxLeadTimeSeconds, minLeadTimeSeconds = 0 } = getScheduledMessageLimits(channel) ?? {};
  const nowMs = now.getTime();

  return {
    earliest: new Date(nowMs + minLeadTimeSeconds * 1000),
    latest:
      maxLeadTimeSeconds === undefined ? undefined : new Date(nowMs + maxLeadTimeSeconds * 1000),
  };
};

export const getScheduleTimeError = (
  scheduledAt: Date,
  { earliest, latest }: ScheduleTimeBounds,
): ScheduleTimeError | undefined => {
  if (scheduledAt < earliest) return 'too_soon';
  if (latest && scheduledAt > latest) return 'too_far';
  return undefined;
};

export const getAvailableSchedulePresets = (now: Date, bounds: ScheduleTimeBounds) =>
  getSchedulePresets(now).filter((preset) => !getScheduleTimeError(preset, bounds));

/** The time the custom picker opens with: tomorrow at 09:00, or the earliest allowed after it. */
export const getDefaultScheduledAt = (now: Date, bounds: ScheduleTimeBounds) => {
  const tomorrowMorning = getLocalDateAtHour(now, 1, SCHEDULE_PRESET_HOURS.morning);
  if (!getScheduleTimeError(tomorrowMorning, bounds)) return tomorrowMorning;

  const earliest = new Date(bounds.earliest);
  earliest.setSeconds(0, 0);
  earliest.setMinutes(earliest.getMinutes() + 1);
  return earliest;
};

/** Formats the device's UTC offset like `GMT+2` or `GMT+5:30`. */
export const formatTimeZoneOffset = (date: Date) => {
  const offset = -date.getTimezoneOffset();
  if (!offset) return 'GMT';

  const sign = offset < 0 ? '-' : '+';
  const absolute = Math.abs(offset);
  const hours = Math.floor(absolute / 60);
  const minutes = absolute % 60;

  return minutes ? `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}` : `GMT${sign}${hours}`;
};
