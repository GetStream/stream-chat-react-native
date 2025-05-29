import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteReactionsForMessage = async ({
  execute = true,
  messageId,
}: {
  messageId: string;
  execute?: boolean;
}) => {
  const query = createDeleteQuery('reactions', {
    messageId,
  });
  console.log('deleteReactionsForMessage', {
    execute,
    messageId,
  });
  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
