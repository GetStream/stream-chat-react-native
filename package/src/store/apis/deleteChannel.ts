import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteChannel = ({ cid, flush = true }: { cid: string; flush?: boolean }) => {
  const query = createDeleteQuery('channels', {
    cid,
  });

  SqliteClient.logger?.('info', 'deleteChannel', {
    cid,
    flush,
  });

  if (flush) {
    SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
