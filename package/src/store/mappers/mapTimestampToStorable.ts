/**
 * Stores a unix-nanosecond timestamp in its `INTEGER` column unchanged, mapping `undefined` to
 * `null`. Nothing is lost: `JSON.parse` already rounded the value to the nearest double (~256 ns).
 *
 * The `null` matters: `upsertStatementParts` omits `undefined` values from the column list, so an
 * absent date on an upsert-update would keep the stored value rather than clear it.
 */
export const mapTimestampToStorable = (timestamp?: number | null): number | null =>
  timestamp ?? null;
