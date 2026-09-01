/**
 * A timestamp on its way *into* SQLite. Unix nanoseconds in, unix nanoseconds out — every date
 * column is `INTEGER` holding exactly what the API put on the wire, so there is no conversion
 * here and nothing is lost. The `INTEGER` columns are wide enough (int64) and the round trip is
 * exact, because a nanosecond timestamp is already an integral `double` by the time
 * `JSON.parse` has read the response.
 *
 * The only thing this function does is pick `null` over `undefined`, and that choice is
 * load-bearing rather than stylistic: `upsertStatementParts` omits `undefined` values from the
 * column list, so an absent date on an upsert-**update** would silently keep whatever was
 * already stored. Writing an explicit `null` clears it, which is what the previous ISO mapper
 * did by returning `''`.
 */
export const mapTimestampToStorable = (timestamp?: number | null): number | null =>
  timestamp ?? null;
