import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

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

  QuickSqliteClient.logger?.('info', 'deleteMessagesForChannel', {
    cid,
    flush,
  });

  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
