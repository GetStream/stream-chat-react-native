import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deleteReactionsForMessage = ({
  flush = true,
  messageId,
}: {
  messageId: string;
  flush?: boolean;
}) => {
  const query = createDeleteQuery('reactions', {
    messageId,
  });
  console.log('deleteReactionsForMessage', {
    flush,
    messageId,
  });
  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
