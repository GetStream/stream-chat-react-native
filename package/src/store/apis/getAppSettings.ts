import type { AppSettingsAPIResponse } from 'stream-chat';

import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';

export const getAppSettings = async ({
  currentUserId,
}: {
  currentUserId: string;
}): Promise<AppSettingsAPIResponse | null> => {
  SqliteClient.logger?.('info', 'getAppSettings', {
    currentUserId,
  });
  const result = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId: currentUserId,
    }),
  );

  return result[0]?.appSettings ? JSON.parse(result[0].appSettings) : null;
};
