import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deletePendingTask = ({ id }: { id: number }) => {
  const query = createDeleteQuery('pendingTasks', {
    id,
  });

  QuickSqliteClient.executeSql.apply(null, query);

  return [query];
};
