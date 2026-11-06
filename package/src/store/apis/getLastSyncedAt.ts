import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';

export const getLastSyncedAt = async ({
  userId,
}: {
  userId: string;
}): Promise<string | undefined> => {
  SqliteClient.logger?.('info', 'getLastSyncedAt', { userId });
  const result = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId,
    }),
  );

  return result[0]?.lastSyncedAt;
};
