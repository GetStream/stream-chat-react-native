import { Streami18n } from '../../utils/i18n/Streami18n';
import { getCalendarDateStringForA11y, getDateString } from '../utils';

/**
 * Timestamps that reach the UI in a shape core's formatters cannot handle.
 *
 * The API expresses timestamps as nanoseconds since the epoch, and `stream-chat` converts them for
 * the fields its response decoders name. `PollResponseData`'s decoder names `latest_answers` and
 * `own_votes` but **not** `latest_votes_by_option`, so a poll vote's `created_at` arrives as a raw
 * integer near 1e18 — measured on a device as `1787870023772367000`. That is past the largest value
 * `new Date` accepts, so Day.js builds an invalid instance and `format()` renders the literal string
 * `"Invalid Date"`, which is what the poll results screen showed next to the voter's name.
 *
 * Every date the SDK renders goes through these wrappers, so the guard belongs here rather than at
 * any one of the ~14 call sites: the shape a timestamp arrived in is not something a call site can
 * see.
 */
describe('date normalization', () => {
  let t: Awaited<ReturnType<Streami18n['init']>>['t'];
  let tDateTimeParser: Awaited<ReturnType<Streami18n['init']>>['tDateTimeParser'];

  beforeAll(async () => {
    ({ t, tDateTimeParser } = await new Streami18n({ logger: () => {} }).init());
  });

  const render = (messageCreatedAt: unknown, timestampTranslationKey: string) =>
    getDateString({
      // The declared type is `string | Date`; the whole point is that reality is wider.
      messageCreatedAt: messageCreatedAt as string | Date,
      t,
      tDateTimeParser,
      timestampTranslationKey,
    });

  it('renders a nanosecond timestamp as the instant it represents', () => {
    const instant = Date.UTC(2026, 7, 20, 12, 0, 0);
    const nanoseconds = instant * 1e6;

    // `timestamp.MessageTimestamp` formats as `LT`, so the assertion pins the actual instant rather
    // than a relative word that depends on the clock.
    expect(render(nanoseconds, 'timestamp.MessageTimestamp')).toBe(
      render(new Date(instant), 'timestamp.MessageTimestamp'),
    );
    expect(render(nanoseconds, 'timestamp.MessageTimestamp')).toBe('12:00 PM');
  });

  it('is the regression case measured on device', () => {
    // The exact value the poll results screen rendered as "Invalid Date".
    expect(render(1787870023772367000, 'timestamp.PollVote')).not.toMatch(/Invalid Date/);
    expect(render(1787870023772367000, 'timestamp.MessageTimestamp')).toBe(
      render(new Date(1787870023772367000 / 1e6), 'timestamp.MessageTimestamp'),
    );
  });

  it('leaves a millisecond timestamp alone', () => {
    // In range, so not rescaled — an integrator passing epoch millis through the public
    // `getDateString` must keep working.
    const instant = Date.UTC(2026, 7, 20, 12, 0, 0);
    expect(render(instant, 'timestamp.MessageTimestamp')).toBe('12:00 PM');
  });

  it('renders nothing rather than the words "Invalid Date"', () => {
    // Out of range even after rescaling (anything past 8.64e15 nanoseconds-worth), so there is no
    // instant to show. `null` is what every caller already treats as "omit the element".
    expect(render(1e22, 'timestamp.MessageTimestamp')).toBeNull();
    // And the output guard catches an already-invalid Date, whatever produced it.
    expect(render(new Date('nonsense'), 'timestamp.MessageTimestamp')).toBeNull();
  });

  it('normalizes the accessibility date the same way', () => {
    const instant = Date.UTC(2026, 7, 20, 12, 0, 0);
    const spoken = getCalendarDateStringForA11y({
      messageCreatedAt: (instant * 1e6) as unknown as Date,
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
