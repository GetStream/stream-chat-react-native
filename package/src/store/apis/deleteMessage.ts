import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deleteMessage = ({ flush = true, id }: { id: string; flush?: boolean }) => {
  const query = createDeleteQuery('messages', {
    id,
  });
  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
