import type { ChannelFilters, ChannelSort } from 'stream-chat';

import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../../SqliteClient';

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

export const selectChannelIdsForFilterSort = async ({
  filters,
  sort,
}: {
  filters?: ChannelFilters;
  sort?: ChannelSort;
}): Promise<string[] | null> => {
  const query = convertFilterSortToQuery({ filters, sort });

  SqliteClient.logger?.('info', 'selectChannelIdsForFilterSort', {
    query,
  });

  const results = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('channelQueries', ['*'], {
      id: query,
    }),
  );

  const channelIdsStr = results?.[0]?.cids;
  return channelIdsStr ? JSON.parse(channelIdsStr) : null;
};
