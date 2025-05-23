import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteMessage = async ({ execute = true, id }: { id: string; execute?: boolean }) => {
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
    execute,
    id,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
