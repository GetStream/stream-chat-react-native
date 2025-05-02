import { SqliteClient } from '../SqliteClient';

export const deleteMessagesForChannel = async ({
  cid,
  truncated_at,
  flush = true,
}: {
  cid: string;
  truncated_at?: string;
  flush?: boolean;
}) => {
  const timestamp = truncated_at ? new Date(truncated_at).toISOString() : new Date().toISOString();
  const query: [string, (string | number)[]] = [
    `DELETE FROM messages WHERE cid = ? AND createdAt <= ?`,
    [cid, timestamp],
  ];

  SqliteClient.logger?.('info', 'deleteMessagesForChannel', {
    cid,
    flush,
    truncated_at,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
