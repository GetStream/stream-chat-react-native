import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteReactionsForMessage = async ({
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
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
