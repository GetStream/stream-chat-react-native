import { SqliteClient } from '../SqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deletePendingTask = ({ id }: { id: number }) => {
  const query = createDeleteQuery('pendingTasks', {
    id,
  });

  SqliteClient.logger?.('info', 'deletePendingTask', {
    id,
  });

  SqliteClient.executeSql.apply(null, query);

  return [query];
};
