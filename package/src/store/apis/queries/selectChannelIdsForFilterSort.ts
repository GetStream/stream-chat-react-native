import type { ChannelFilters, ChannelSort } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { QuickSqliteClient } from '../../QuickSqliteClient';
import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';

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
  const results = QuickSqliteClient.executeSql.apply(
    null,
    createSelectQuery('channelQueries', ['*'], {
      id: query,
    }),
  );

  const channelIdsStr = results?.[0]?.cids;
  return channelIdsStr ? JSON.parse(channelIdsStr) : [];
};
