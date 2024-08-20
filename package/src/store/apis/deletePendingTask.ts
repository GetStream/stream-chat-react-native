import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

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
