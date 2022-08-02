import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deleteChannel = ({ cid, flush = true }: { cid: string; flush?: boolean }) => {
  const query = createDeleteQuery('channels', {
    cid,
  });

  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
