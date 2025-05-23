import { MessageLabel } from 'stream-chat';

import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';

export const softDeleteMessage = async ({
  execute = true,
  id,
}: {
  id: string;
  execute?: boolean;
}) => {
  const query = createUpdateQuery(
    'messages',
    {
      deletedAt: new Date().toISOString(),
      type: 'deleted' as MessageLabel,
    },
    { id },
  );

  SqliteClient.logger?.('info', 'softDeleteMessage', {
    execute,
    id,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
