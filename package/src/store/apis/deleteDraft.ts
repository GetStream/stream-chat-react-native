import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteDraft = async ({
  cid,
  parent_id,
  execute = true,
}: {
  cid: string;
  parent_id?: string;
  execute?: boolean;
}) => {
  const query = createDeleteQuery('draft', {
    cid,
    parentId: parent_id,
  });

  SqliteClient.logger?.('info', 'deleteDraft', {
    cid,
    execute,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
