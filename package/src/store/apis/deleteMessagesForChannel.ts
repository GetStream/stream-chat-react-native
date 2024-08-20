import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteMessagesForChannel = ({
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
    SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
