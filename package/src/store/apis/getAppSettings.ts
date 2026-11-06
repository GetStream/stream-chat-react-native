import type { GetApplicationResponse } from 'stream-chat';

import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';

export const getAppSettings = async ({
  userId,
}: {
  userId: string;
}): Promise<GetApplicationResponse | null> => {
  SqliteClient.logger?.('info', 'getAppSettings', {
    userId,
  });
  const result = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('userSyncStatus', ['*'], {
      userId,
    }),
  );

  return result[0]?.appSettings ? JSON.parse(result[0].appSettings) : null;
};
