/* eslint-disable no-underscore-dangle */
import { DB_NAME } from '../../constants';
import type { QueryChannelsMapRow } from '../../types';

export const getChannelIdsForQuery = (query: string): string[] => {
  const { message, rows, status } = sqlite.executeSql(
    DB_NAME,
    `SELECT * FROM queryChannelsMap where id = ?`,
    [query],
  );

  if (status === 1) {
    console.error(`Querying for queryChannelsMap failed: ${message}`);
  }

  const results: QueryChannelsMapRow[] = rows ? rows._array : [];

  const channelIdsStr = results?.[0]?.cids;
  return channelIdsStr ? JSON.parse(channelIdsStr) : [];
};
