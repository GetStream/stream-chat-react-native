import type { GetApplicationResponse } from 'stream-chat';

import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertAppSettings = async ({
  appSettings,
  userId,
  execute = true,
}: {
  appSettings: GetApplicationResponse;
  userId: string;
  execute?: boolean;
}) => {
  const storableAppSettings = JSON.stringify(appSettings);
  const queries = [
    createUpsertQuery('userSyncStatus', {
      appSettings: storableAppSettings,
      userId,
    }),
  ];

  SqliteClient.logger?.('info', 'upsertAppSettings', {
    appSettings: storableAppSettings,
    execute,
    userId,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
