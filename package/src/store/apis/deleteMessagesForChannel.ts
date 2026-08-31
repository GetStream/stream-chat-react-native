import { mapDateTimeToStorable } from '../mappers/mapDateTimeToStorable';
import { SqliteClient } from '../SqliteClient';

export const deleteMessagesForChannel = async ({
  cid,
  truncated_at,
  execute = true,
}: {
  cid: string;
  /** Unix nanoseconds, as the API sends it. */
  truncated_at?: number;
  execute?: boolean;
}) => {
  // The column holds ISO, so the cutoff has to be ISO too — and it has to go through the mapper:
  // `new Date(nanoseconds)` is out of range and `.toISOString()` on it throws `RangeError`.
  const timestamp =
    truncated_at != null ? mapDateTimeToStorable(truncated_at) : new Date().toISOString();
  const query: [string, (string | number)[]] = [
    `DELETE FROM messages WHERE cid = ? AND createdAt <= ?`,
    [cid, timestamp],
  ];

  SqliteClient.logger?.('info', 'deleteMessagesForChannel', {
    cid,
    execute,
    truncated_at,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
