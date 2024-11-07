import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteMessage = async ({ flush = true, id }: { id: string; flush?: boolean }) => {
  const query = createDeleteQuery('messages', {
    id,
  });

  SqliteClient.logger?.('info', 'deleteMessage', {
    flush,
    id,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
