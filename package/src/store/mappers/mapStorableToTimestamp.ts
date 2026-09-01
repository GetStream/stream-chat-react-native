/**
 * A timestamp on its way *out of* SQLite. The inverse of `mapTimestampToStorable`, and equally
 * conversion-free: the column already holds the unix-nanosecond number every response and event
 * field carries.
 *
 * It exists for the one thing SQLite and the response types disagree about — SQLite says `null`
 * for an absent timestamp, the generated types say `undefined`.
 */
export const mapStorableToTimestamp = (timestamp?: number | null): number | undefined =>
  timestamp ?? undefined;
