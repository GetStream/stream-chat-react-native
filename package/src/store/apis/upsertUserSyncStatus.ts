import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertUserSyncStatus = async ({
  userId,
  lastSyncedAt,
  execute = true,
}: {
  userId: string;
  lastSyncedAt: string;
  execute?: boolean;
}) => {
  const queries = [
    createUpsertQuery('userSyncStatus', {
      lastSyncedAt,
      userId,
    }),
  ];

  SqliteClient.logger?.('info', 'upsertUserSyncStatus', {
    lastSyncedAt,
    userId,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
