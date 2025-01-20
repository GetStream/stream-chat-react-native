import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';

export const getLastSyncedAt = async ({
  currentUserId,
}: {
  currentUserId: string;
}): Promise<number | undefined> => {
  SqliteClient.logger?.('info', 'getLastSyncedAt', { currentUserId });
  const result = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId: currentUserId,
    }),
  );

  if (typeof result[0]?.lastSyncedAt === 'number') {
    return result[0]?.lastSyncedAt;
  }
  return undefined;
};
