import { asTimestampNS } from 'stream-chat';
import type { TimestampNS } from 'stream-chat';

/**
 * A timestamp on its way *out of* SQLite. The inverse of `mapTimestampToStorable`, and equally
 * conversion-free: the column already holds the unix-nanosecond number every response and event
 * field carries, so it is branded as a `TimestampNS` without being converted.
 *
 * It exists for the one thing SQLite and the response types disagree about — SQLite says `null`
 * for an absent timestamp, the generated types say `undefined`.
 *
 * Every date column is nullable, so use {@link mapStorableToRequiredTimestamp} for a field the model
 * declares required (`created_at` / `updated_at`). The compiler cannot catch a miss in a mapper whose
 * literal ends with `...JSON.parse(extraData)` — spreading `any` disables the check.
 */
export const mapStorableToTimestamp = (timestamp?: number | null): TimestampNS | undefined =>
  timestamp == null ? undefined : asTimestampNS(timestamp);

/**
 * {@link mapStorableToTimestamp} for a field the model declares required: an absent column reads
 * back as the epoch, which every "no timestamp" consumer already treats as nothing having happened.
 */
export const mapStorableToRequiredTimestamp = (timestamp?: number | null): TimestampNS =>
  mapStorableToTimestamp(timestamp) ?? asTimestampNS(0);
