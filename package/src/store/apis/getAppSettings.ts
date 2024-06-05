import type { AppSettingsAPIResponse } from 'stream-chat';

import { SqliteClient } from '../SqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';

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
