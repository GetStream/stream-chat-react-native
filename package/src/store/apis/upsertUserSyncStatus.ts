import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertUserSyncStatus = async ({
  currentUserId,
  lastSyncedAt,
  execute = true,
}: {
  currentUserId: string;
  lastSyncedAt: string;
  execute?: boolean;
}) => {
  const queries = [
    createUpsertQuery('userSyncStatus', {
      lastSyncedAt,
      userId: currentUserId,
    }),
  ];

  SqliteClient.logger?.('info', 'upsertUserSyncStatus', {
    lastSyncedAt,
    userId: currentUserId,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
