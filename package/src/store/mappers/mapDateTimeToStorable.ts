import { nsToDate } from 'stream-chat';

/**
 * A timestamp on its way *into* SQLite, as an ISO-8601 string.
 *
 * Every date column is `TEXT` holding ISO, and it stays that way deliberately: the queries in
 * `store/apis/queries` order by these columns with `datetime()`, `strftime()` and plain
 * lexicographic comparison, and rows written by earlier versions are already ISO. Converting at
 * this boundary instead of changing the column format keeps all of that working and leaves existing
 * databases readable — so this change needs no schema-version bump.
 *
 * A `number` is a wire timestamp (unix nanoseconds) and goes through `nsToDate`: `new Date(ns)` is
 * out of Date's range, and `.toISOString()` on the resulting Invalid Date throws `RangeError`.
 * `Date` and `string` are still accepted for the odd locally-stamped value.
 */
export const mapDateTimeToStorable = (datetime?: number | string | Date | null) => {
  if (datetime === null || datetime === undefined || datetime === '') {
    return '';
  }

  const date = typeof datetime === 'number' ? nsToDate(datetime) : new Date(datetime);

  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};
