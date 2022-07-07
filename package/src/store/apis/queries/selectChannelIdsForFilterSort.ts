import type { ChannelFilters, ChannelSort } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { QuickSqliteClient } from '../../QuickSqliteClient';

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
  const results = QuickSqliteClient.executeSql(`SELECT * FROM channelQueries where id = ?`, [
    query,
  ]);

  const channelIdsStr = results?.[0]?.cids;
  return channelIdsStr ? JSON.parse(channelIdsStr) : [];
};
