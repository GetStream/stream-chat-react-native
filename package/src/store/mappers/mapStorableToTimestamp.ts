import { asTimestampNS } from 'stream-chat';
import type { TimestampNS } from 'stream-chat';

/**
 * Brands a stored unix-nanosecond column as a `TimestampNS` without converting it (the inverse of
 * `mapTimestampToStorable`), and maps SQLite's `null` for an absent timestamp to `undefined`.
 *
 * Every date column is nullable, so use {@link mapStorableToRequiredTimestamp} for fields the model
 * declares required (`created_at`, `updated_at`). The compiler cannot catch a miss in a mapper
 * whose literal ends with `...JSON.parse(extraData)`, because spreading `any` disables the check.
 */
export const mapStorableToTimestamp = (timestamp?: number | null): TimestampNS | undefined =>
  timestamp == null ? undefined : asTimestampNS(timestamp);

/**
 * {@link mapStorableToTimestamp} for a field the model declares required: an absent column reads
 * back as the epoch, which consumers treat as no timestamp.
 */
export const mapStorableToRequiredTimestamp = (timestamp?: number | null): TimestampNS =>
  mapStorableToTimestamp(timestamp) ?? asTimestampNS(0);
