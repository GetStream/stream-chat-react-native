import { convertTimestampToDate } from 'stream-chat';

import { Streami18n } from '../../utils/i18n/Streami18n';
import { getCalendarDateStringForA11y, getDateString } from '../utils';

/**
 * Where a wire timestamp becomes something renderable.
 *
 * The API expresses every server-sent timestamp as nanoseconds since the epoch — measured on a
 * device as `1787870023772367000`. That is past the largest value `new Date` accepts, so handing one
 * straight to a date library builds an invalid instance and `format()` renders the literal string
 * `"Invalid Date"`, which is what the poll results screen once showed next to a voter's name.
 *
 * These formatters used to rescale such a value themselves, guessing from its magnitude. They no
 * longer do: each of the ~14 call sites converts with `convertTimestampToDate` where core data enters
 * the tree. This suite pins both halves of that contract — the conversion renders the right
 * instant, and an *unconverted* value renders nothing rather than a plausible-looking wrong date,
 * so a missed conversion shows up as a blank instead of hiding.
 */
describe('wire timestamps at the i18n boundary', () => {
  let t: Awaited<ReturnType<Streami18n['init']>>['t'];
  let tDateTimeParser: Awaited<ReturnType<Streami18n['init']>>['tDateTimeParser'];

  beforeAll(async () => {
    ({ t, tDateTimeParser } = await new Streami18n({ logger: () => {} }).init());
  });

  const render = (messageCreatedAt: unknown, timestampTranslationKey: string) =>
    getDateString({
      messageCreatedAt: messageCreatedAt as string | Date,
      t,
      tDateTimeParser,
      timestampTranslationKey,
    });

  it('renders the instant a converted wire timestamp represents', () => {
    const instant = Date.UTC(2026, 7, 20, 12, 0, 0);
    const nanoseconds = instant * 1e6;

    // `timestamp.MessageTimestamp` formats as `LT`, so this pins the actual instant rather than a
    // relative word that depends on the clock.
    expect(render(convertTimestampToDate(nanoseconds), 'timestamp.MessageTimestamp')).toBe(
      '12:00 PM',
    );
  });

  it('converts the value measured on device', () => {
    const nanoseconds = 1787870023772367000;

    expect(render(convertTimestampToDate(nanoseconds), 'timestamp.PollVote')).not.toMatch(
      /Invalid Date/,
    );
    expect(render(convertTimestampToDate(nanoseconds), 'timestamp.MessageTimestamp')).toBe(
      render(new Date(nanoseconds / 1e6), 'timestamp.MessageTimestamp'),
    );
  });

  it('renders nothing for a wire timestamp that was never converted', () => {
    // The formatters no longer rescale by magnitude, so a raw nanosecond value has no instant to
    // show. `null` is what every caller already treats as "omit the element" — a missed conversion
    // surfaces as a blank timestamp rather than a date ~50,000 years out.
    expect(render(1787870023772367000, 'timestamp.MessageTimestamp')).toBeNull();
  });

  it('declines a value that cannot be converted at all', () => {
    expect(convertTimestampToDate(Number.NaN)).toBeUndefined();
    expect(convertTimestampToDate(undefined)).toBeUndefined();
    expect(convertTimestampToDate(null)).toBeUndefined();
    // And the output guard still catches an already-invalid Date, whatever produced it.
    expect(render(new Date('nonsense'), 'timestamp.MessageTimestamp')).toBeNull();
  });

  it('converts the accessibility date the same way', () => {
    const instant = Date.UTC(2026, 7, 20, 12, 0, 0);
    const spoken = getCalendarDateStringForA11y({
      messageCreatedAt: convertTimestampToDate(instant * 1e6),
      tDateTimeParser,
    });

    expect(spoken).not.toMatch(/Invalid Date/);
    expect(spoken).toBe(
      getCalendarDateStringForA11y({ messageCreatedAt: new Date(instant), tDateTimeParser }),
    );
  });

  it('still renders ordinary Date and ISO string inputs', () => {
    const instant = new Date(Date.UTC(2026, 7, 20, 12, 0, 0));
    expect(render(instant, 'timestamp.MessageTimestamp')).toBe('12:00 PM');
    expect(render(instant.toISOString(), 'timestamp.MessageTimestamp')).toBe('12:00 PM');
  });
});
