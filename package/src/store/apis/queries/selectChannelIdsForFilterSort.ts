import type { ChannelFilters, ChannelSort } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

import { selectQuery } from '../../utils/selectQuery';
import { convertFilterSortToQuery } from '../utils/convertFilterSortToQuery';

export const selectChannelIdsForFilterSort = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  filters,
  sort,
}: {
  filters?: ChannelFilters<StreamChatGenerics>;
  sort?: ChannelSort<StreamChatGenerics>;
}): string[] => {
  const query = convertFilterSortToQuery({ filters, sort });
  const results = selectQuery(
    `SELECT * FROM queryChannelsMap where id = ?`,
    [query],
    'query cids for filter and sort',
  );

  const channelIdsStr = results?.[0]?.cids;
  return channelIdsStr ? JSON.parse(channelIdsStr) : [];
};
