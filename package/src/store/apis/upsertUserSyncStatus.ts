import { QuickSqliteClient } from '../QuickSqliteClient';
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

  QuickSqliteClient.logger?.('info', 'upsertUserSyncStatus', {
    lastSyncedAt,
    userId: currentUserId,
  });

  QuickSqliteClient.executeSql.apply(null, query);
};
