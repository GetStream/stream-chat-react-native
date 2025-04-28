import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteMessage = async ({ flush = true, id }: { id: string; flush?: boolean }) => {
  const queries = [];

  queries.push(
    createDeleteQuery('reactions', {
      messageId: id,
    }),
  );

  queries.push(
    createDeleteQuery('messages', {
      id,
    }),
  );

  SqliteClient.logger?.('info', 'deleteMessage', {
    flush,
    id,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
