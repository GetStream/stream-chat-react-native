import { SqliteClient } from '../SqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertUserSyncStatus = ({
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

  SqliteClient.executeSql.apply(null, query);
};
