import type { AppSettingsAPIResponse } from 'stream-chat';

import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertAppSettings = async ({
  appSettings,
  currentUserId,
  flush = true,
}: {
  appSettings: AppSettingsAPIResponse;
  currentUserId: string;
  flush?: boolean;
}) => {
  const storableAppSettings = JSON.stringify(appSettings);
  const query = createUpsertQuery('userSyncStatus', {
    appSettings: storableAppSettings,
    userId: currentUserId,
  });

  SqliteClient.logger?.('info', 'upsertAppSettings', {
    appSettings: storableAppSettings,
    flush,
    userId: currentUserId,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }
};
