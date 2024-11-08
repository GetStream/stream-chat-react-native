import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deletePendingTask = async ({ id }: { id: number }) => {
  const query = createDeleteQuery('pendingTasks', {
    id,
  });

  SqliteClient.logger?.('info', 'deletePendingTask', {
    id,
  });

  await SqliteClient.executeSql.apply(null, query);

  return [query];
};
