import { MessageLabel } from 'stream-chat';

import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';

export const softDeleteMessage = async ({ flush = true, id }: { id: string; flush?: boolean }) => {
  const query = createUpdateQuery(
    'messages',
    {
      deletedAt: new Date().toISOString(),
      type: 'deleted' as MessageLabel,
    },
    { id },
  );

  SqliteClient.logger?.('info', 'softDeleteMessage', {
    flush,
    id,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
