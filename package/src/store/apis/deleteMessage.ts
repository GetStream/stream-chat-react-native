import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const deleteMessage = async ({ execute = true, id }: { id: string; execute?: boolean }) => {
  const queries: PreparedQueries[] = [];

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
