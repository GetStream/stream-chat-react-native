import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertUserSyncStatus = async ({
  currentUserId,
  lastSyncedAt,
}: {
  currentUserId: string;
  lastSyncedAt: string;
}) => {
  const query = createUpsertQuery('userSyncStatus', {
    lastSyncedAt,
    userId: currentUserId,
  });

  SqliteClient.logger?.('info', 'upsertUserSyncStatus', {
    lastSyncedAt,
    userId: currentUserId,
  });

  await SqliteClient.executeSql.apply(null, query);
};
