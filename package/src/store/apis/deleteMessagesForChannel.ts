import { nowNs } from 'stream-chat';

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
  // `createdAt` holds unix nanoseconds, so the cutoff is one too and the comparison is numeric.
  const timestamp = truncated_at ?? nowNs();
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
