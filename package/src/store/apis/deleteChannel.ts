import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteChannel = async ({ cid, flush = true }: { cid: string; flush?: boolean }) => {
  const query = createDeleteQuery('channels', {
    cid,
  });

  SqliteClient.logger?.('info', 'deleteChannel', {
    cid,
    flush,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
