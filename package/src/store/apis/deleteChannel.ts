import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deleteChannel = ({ cid, flush = true }: { cid: string; flush?: boolean }) => {
  const query = createDeleteQuery('channels', {
    cid,
  });

  QuickSqliteClient.logger?.('info', 'deleteChannel', {
    cid,
    flush,
  });

  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
