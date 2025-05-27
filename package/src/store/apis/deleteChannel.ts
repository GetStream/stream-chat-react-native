import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteChannel = async ({
  cid,
  execute = true,
}: {
  cid: string;
  execute?: boolean;
}) => {
  const query = createDeleteQuery('channels', {
    cid,
  });

  SqliteClient.logger?.('info', 'deleteChannel', {
    cid,
    execute,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
