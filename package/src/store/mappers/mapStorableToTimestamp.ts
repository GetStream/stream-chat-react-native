/**
 * A timestamp on its way *out of* SQLite. The inverse of `mapTimestampToStorable`, and equally
 * conversion-free: the column already holds the unix-nanosecond number every response and event
 * field carries.
 *
 * It exists for the one thing SQLite and the response types disagree about — SQLite says `null`
 * for an absent timestamp, the generated types say `undefined`.
 *
 * Every date column is nullable, so append `?? 0` when assigning to a field the model declares
 * required (`created_at` / `updated_at`). The compiler cannot catch a miss in a mapper whose
 * literal ends with `...JSON.parse(extraData)` — spreading `any` disables the check.
 */
export const mapStorableToTimestamp = (timestamp?: number | null): number | undefined =>
  timestamp ?? undefined;
