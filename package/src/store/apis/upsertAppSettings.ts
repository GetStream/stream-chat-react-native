import type { AppSettingsAPIResponse } from 'stream-chat';

import { QuickSqliteClient } from '../QuickSqliteClient';
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
  const query = createUpsertQuery('userSyncStatus', {
    appSettings: JSON.stringify(appSettings),
    userId: currentUserId,
  });

  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }
};
