import type { AppSettingsAPIResponse } from 'stream-chat';

import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';

export const getAppSettings = ({
  currentUserId,
}: {
  currentUserId: string;
}): AppSettingsAPIResponse => {
  SqliteClient.logger?.('info', 'getAppSettings', {
    currentUserId,
  });
  const result = SqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId: currentUserId,
    }),
  );

  return result[0]?.appSettings ? JSON.parse(result[0].appSettings) : null;
};
