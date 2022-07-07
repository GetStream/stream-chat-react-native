import { QuickSqliteClient } from '../QuickSqliteClient';

export const getLastSyncedAt = ({ currentUserId }: { currentUserId: string }) => {
  const result = QuickSqliteClient.executeSql('SELECT * FROM userSyncStatus WHERE userId = ?', [
    currentUserId,
  ]);

  return result[0]?.lastSyncedAt;
};
