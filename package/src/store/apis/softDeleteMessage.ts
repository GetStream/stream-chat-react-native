import { DBDeleteMessageType, MessageLabel } from 'stream-chat';

import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';

export const softDeleteMessage = async ({
  deleteForMe = false,
  execute = true,
  id,
}: DBDeleteMessageType) => {
  const query = createUpdateQuery(
    'messages',
    {
      deletedAt: deleteForMe ? undefined : new Date().toISOString(),
      deletedForMe: deleteForMe,
      type: 'deleted' as MessageLabel,
    },
    { id },
  );

  SqliteClient.logger?.('info', 'softDeleteMessage', {
    deleteForMe,
    execute,
    id,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
