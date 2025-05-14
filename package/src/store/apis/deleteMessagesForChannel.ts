import { SqliteClient } from '../SqliteClient';

export const deleteMessagesForChannel = async ({
  cid,
  truncated_at,
  execute = true,
}: {
  cid: string;
  truncated_at?: string;
  execute?: boolean;
}) => {
  const timestamp = truncated_at ? new Date(truncated_at).toISOString() : new Date().toISOString();
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
