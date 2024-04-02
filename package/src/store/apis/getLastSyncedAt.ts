import { QuickSqliteClient } from '../QuickSqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';

export const getLastSyncedAt = ({
  currentUserId,
}: {
  currentUserId: string;
}): number | undefined => {
  QuickSqliteClient.logger?.('info', 'getLastSyncedAt', { currentUserId });
  const result = QuickSqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId: currentUserId,
    }),
  );

  return result[0]?.lastSyncedAt;
};
