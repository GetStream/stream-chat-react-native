import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteMessagesForChannel = async ({
  cid,
  flush = true,
}: {
  cid: string;
  flush?: boolean;
}) => {
  const query = createDeleteQuery('messages', {
    cid,
  });

  SqliteClient.logger?.('info', 'deleteMessagesForChannel', {
    cid,
    flush,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
