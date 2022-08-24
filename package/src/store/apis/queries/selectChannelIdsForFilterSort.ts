import type { ChannelFilters, ChannelSort } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';
import { QuickSqliteClient } from '../../QuickSqliteClient';
import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';

import { convertFilterSortToQuery } from '../utils/convertFilterSortToQuery';

/**
 * Gets the channel ids from database for given filter and sort query.
 *
 * @param {Object} param
 * @param {Object} param.filters Filters for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 * @param {Object} param.sort Sort for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 *
 * @returns Array of channel ids corresponding to filters & sort. Returns null if filters + sort query doesn't exist in "channelQueries" table.
 */

export const selectChannelIdsForFilterSort = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  filters,
  sort,
}: {
  filters?: ChannelFilters<StreamChatGenerics>;
  sort?: ChannelSort<StreamChatGenerics>;
}): string[] | null => {
  const query = convertFilterSortToQuery({ filters, sort });
  const results = QuickSqliteClient.executeSql.apply(
    null,
    createSelectQuery('channelQueries', ['*'], {
      id: query,
    }),
  );

  const channelIdsStr = results?.[0]?.cids;
  return channelIdsStr ? JSON.parse(channelIdsStr) : null;
};
