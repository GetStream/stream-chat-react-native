import { SqliteClient } from '../SqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';

export const getLastSyncedAt = ({
  currentUserId,
}: {
  currentUserId: string;
}): number | undefined => {
  SqliteClient.logger?.('info', 'getLastSyncedAt', { currentUserId });
  const result = SqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId: currentUserId,
    }),
  );

  return result[0]?.lastSyncedAt;
};
