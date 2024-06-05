import type { AppSettingsAPIResponse } from 'stream-chat';

import { SqliteClient } from '../SqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertAppSettings = ({
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
    SqliteClient.executeSql.apply(null, query);
  }
};
