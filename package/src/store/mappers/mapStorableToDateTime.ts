import { msToNs } from 'stream-chat';

/**
 * A timestamp on its way *out of* SQLite, back to the unix-nanosecond number every response and
 * event field carries. The inverse of `mapDateTimeToStorable`.
 *
 * Returns `undefined` for an absent or unparseable value rather than `NaN`, so an optional field
 * stays absent instead of becoming a timestamp nothing can render.
 */
export const mapStorableToDateTime = (datetime?: string | null): number | undefined => {
  if (!datetime) return undefined;

  const ms = Date.parse(datetime);

  return Number.isNaN(ms) ? undefined : msToNs(ms);
};
