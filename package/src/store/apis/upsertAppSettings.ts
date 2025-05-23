import type { AppSettingsAPIResponse } from 'stream-chat';

import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertAppSettings = async ({
  appSettings,
  currentUserId,
  execute = true,
}: {
  appSettings: AppSettingsAPIResponse;
  currentUserId: string;
  execute?: boolean;
}) => {
  const storableAppSettings = JSON.stringify(appSettings);
  const queries = [
    createUpsertQuery('userSyncStatus', {
      appSettings: storableAppSettings,
      userId: currentUserId,
    }),
  ];

  SqliteClient.logger?.('info', 'upsertAppSettings', {
    appSettings: storableAppSettings,
    execute,
    userId: currentUserId,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
