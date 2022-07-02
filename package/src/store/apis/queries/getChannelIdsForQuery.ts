import { selectQuery } from '../../utils/selectQuery';

export const getChannelIdsForQuery = (query: string): string[] => {
  const results = selectQuery(
    `SELECT * FROM queryChannelsMap where id = ?`,
    [query],
    'query cids for filter and sort',
  );

  const channelIdsStr = results?.[0]?.cids;
  return channelIdsStr ? JSON.parse(channelIdsStr) : [];
};
