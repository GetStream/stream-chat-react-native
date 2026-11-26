import type { Channel } from 'stream-chat';
import { StreamAPIError } from 'stream-chat';

import { getScheduleErrorText } from '../utils/scheduleErrors';
import {
  formatTimeZoneOffset,
  getAvailableSchedulePresets,
  getDefaultScheduledAt,
  getSchedulePresets,
  getScheduleTimeBounds,
  getScheduleTimeError,
} from '../utils/scheduleTime';

const channelWithLimits = (limits: { maxLeadTimeSeconds: number; minLeadTimeSeconds: number }) =>
  ({
    serverConfig: {
      scheduled_messages_max_lead_time_seconds: limits.maxLeadTimeSeconds,
      scheduled_messages_max_per_channel: 10,
      scheduled_messages_max_per_user: 100,
      scheduled_messages_min_lead_time_seconds: limits.minLeadTimeSeconds,
    },
  }) as unknown as Channel;

const DAY_SECONDS = 24 * 60 * 60;

describe('getSchedulePresets', () => {
  it('offers tomorrow morning, tomorrow afternoon and next Monday morning', () => {
    // A Wednesday.
    const now = new Date(2026, 9, 21, 15, 30);
    const presets = getSchedulePresets(now);

    expect(presets.map((preset) => [preset.getDate(), preset.getHours()])).toEqual([
      [22, 9],
      [22, 13],
      [26, 9],
    ]);
  });

  it('leaves out Monday when tomorrow is Monday', () => {
    // A Sunday.
    const now = new Date(2026, 9, 25, 20, 0);

    expect(getSchedulePresets(now)).toHaveLength(2);
  });

  it('drops the presets beyond the maximum lead time', () => {
    const now = new Date(2026, 9, 21, 15, 30);
    const bounds = getScheduleTimeBounds(
      channelWithLimits({ maxLeadTimeSeconds: DAY_SECONDS, minLeadTimeSeconds: 60 }),
      now,
    );

    expect(getAvailableSchedulePresets(now, bounds).map((preset) => preset.getHours())).toEqual([
      9, 13,
    ]);
  });
});

describe('getScheduleTimeError', () => {
  const now = new Date(2026, 9, 21, 9, 41, 0);
  const bounds = getScheduleTimeBounds(
    channelWithLimits({ maxLeadTimeSeconds: 7 * DAY_SECONDS, minLeadTimeSeconds: 60 }),
    now,
  );

  it('rejects a time under the minimum lead time', () => {
    expect(getScheduleTimeError(new Date(2026, 9, 21, 9, 41, 30), bounds)).toBe('too_soon');
  });

  it('accepts a time at the minimum lead time', () => {
    expect(getScheduleTimeError(new Date(2026, 9, 21, 9, 42, 0), bounds)).toBeUndefined();
  });

  it('rejects a time beyond the maximum lead time', () => {
    expect(getScheduleTimeError(new Date(2026, 9, 29, 9, 0), bounds)).toBe('too_far');
  });

  it('has no upper bound when the app sets no limits', () => {
    const unbounded = getScheduleTimeBounds({ serverConfig: {} } as unknown as Channel, now);
    expect(getScheduleTimeError(new Date(2030, 0, 1), unbounded)).toBeUndefined();
  });
});

describe('getDefaultScheduledAt', () => {
  it('opens on tomorrow at 09:00', () => {
    const now = new Date(2026, 9, 21, 15, 30);
    const bounds = getScheduleTimeBounds(
      channelWithLimits({ maxLeadTimeSeconds: 7 * DAY_SECONDS, minLeadTimeSeconds: 60 }),
      now,
    );
    const defaultAt = getDefaultScheduledAt(now, bounds);

    expect([defaultAt.getDate(), defaultAt.getHours(), defaultAt.getMinutes()]).toEqual([22, 9, 0]);
  });

  it('falls back to the earliest allowed minute when tomorrow is out of bounds', () => {
    const now = new Date(2026, 9, 21, 15, 30);
    const bounds = getScheduleTimeBounds(
      channelWithLimits({ maxLeadTimeSeconds: 60 * 60, minLeadTimeSeconds: 60 }),
      now,
    );
    const defaultAt = getDefaultScheduledAt(now, bounds);

    expect(getScheduleTimeError(defaultAt, bounds)).toBeUndefined();
    expect(defaultAt.getHours()).toBe(15);
  });
});

describe('formatTimeZoneOffset', () => {
  it('formats whole and half hour offsets', () => {
    const at = (offsetMinutes: number) =>
      ({ getTimezoneOffset: () => offsetMinutes }) as unknown as Date;

    expect(formatTimeZoneOffset(at(-120))).toBe('GMT+2');
    expect(formatTimeZoneOffset(at(-330))).toBe('GMT+5:30');
    expect(formatTimeZoneOffset(at(300))).toBe('GMT-5');
    expect(formatTimeZoneOffset(at(0))).toBe('GMT');
  });
});

describe('getScheduleErrorText', () => {
  const t = ((_key: string, defaultValue: string, options?: Record<string, unknown>) =>
    Object.entries(options ?? {}).reduce(
      (text, [name, value]) => text.replace(`{{ ${name} }}`, String(value)),
      defaultValue,
    )) as never;
  const userLimitError = new StreamAPIError('you can schedule at most 100 messages', {
    code: 118,
    status: 400,
  });

  it("names the per-user limit from the channel's config", () => {
    const channel = channelWithLimits({ maxLeadTimeSeconds: DAY_SECONDS, minLeadTimeSeconds: 60 });

    expect(getScheduleErrorText(t, userLimitError, 'schedule', channel)).toBe(
      "You've reached your limit of 100 scheduled messages.",
    );
  });

  it('leaves the number out when the limit is unknown', () => {
    expect(getScheduleErrorText(t, userLimitError)).toBe(
      "You've reached your limit of scheduled messages.",
    );
  });
});
