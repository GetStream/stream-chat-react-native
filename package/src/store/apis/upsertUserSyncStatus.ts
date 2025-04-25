import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertUserSyncStatus = async ({
  currentUserId,
  lastSyncedAt,
  flush = true,
}: {
  currentUserId: string;
  lastSyncedAt: string;
  flush?: boolean;
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

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
