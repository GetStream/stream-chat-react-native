import type { AppSettingsAPIResponse } from 'stream-chat';

import { QuickSqliteClient } from '../QuickSqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';

export const getAppSettings = ({
  currentUserId,
}: {
  currentUserId: string;
}): AppSettingsAPIResponse => {
  QuickSqliteClient.logger?.('info', 'getAppSettings', {
    currentUserId,
  });
  const result = QuickSqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId: currentUserId,
    }),
  );

  return result[0]?.appSettings ? JSON.parse(result[0].appSettings) : null;
};
