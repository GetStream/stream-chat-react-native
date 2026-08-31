import { mapDateTimeToStorable } from '../mappers/mapDateTimeToStorable';
import { mapStorableToDateTime } from '../mappers/mapStorableToDateTime';

/**
 * The on-disk date format is unchanged by the move to nanosecond timestamps.
 *
 * Every date column is `TEXT` holding ISO-8601, and it stays that way: the queries under
 * `store/apis/queries` order by these columns with `datetime()`, `strftime()` and plain
 * lexicographic comparison. Converting at the mapper boundary instead of changing the column format
 * keeps all of that working — and, as the second case pins, leaves rows written by earlier versions
 * readable, which is why this change needs no `dbVersion` bump.
 */
describe('SQLite date round-trip', () => {
  /** A real on-device value, from the report that prompted the nanosecond work. */
  const NANOS = 1786219962651957000;
  const AS_ISO = new Date(Math.floor(NANOS / 1e6)).toISOString();

  it('writes ISO, so the column format is unchanged', () => {
    expect(mapDateTimeToStorable(NANOS)).toBe(AS_ISO);
    // Not `new Date(NANOS).toISOString()` — that throws `RangeError`, which is the bug this guards.
    expect(() => new Date(NANOS).toISOString()).toThrow(RangeError);
  });

  it('reads a row written by an earlier version back as a wire timestamp', () => {
    // Exactly the shape a v16 database already holds.
    const fromExistingRow = mapStorableToDateTime('2026-08-06T16:12:42.651Z');

    expect(fromExistingRow).toBe(Date.parse('2026-08-06T16:12:42.651Z') * 1e6);
  });

  it('round-trips to the millisecond, which is all ISO carries', () => {
    const stored = mapDateTimeToStorable(NANOS);

    expect(mapStorableToDateTime(stored)).toBe(Math.floor(NANOS / 1e6) * 1e6);
  });

  it('declines rather than throwing on junk', () => {
    expect(mapDateTimeToStorable(Number.NaN)).toBe('');
    expect(mapDateTimeToStorable(null)).toBe('');
    expect(mapStorableToDateTime('')).toBeUndefined();
    expect(mapStorableToDateTime('not a date')).toBeUndefined();
  });
});
