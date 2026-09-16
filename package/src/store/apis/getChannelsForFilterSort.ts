import type {
  ChannelFilters,
  ChannelOptions,
  DBGetChannelsForQueryResult,
  SortParamRequest,
} from 'stream-chat';

import { getChannels } from './getChannels';
import { selectChannelQueryForFilterSort } from './queries/selectChannelQueryForFilterSort';

import { SqliteClient } from '../SqliteClient';

/**
 * Gets the channels from database for given filter and sort query.
 *
 * @param {Object} param
 * @param {string} param.currentUserId Id of current logged in user
 * @param {Object} param.filters Filters for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 * @param {Object} param.sort Sort for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 *
 * @returns The channels corresponding to filters & sort, together with the predefined-filter metadata
 * they were cached with. Returns null if filters + sort query doesn't exist in "channelQueries" table.
 */
export const getChannelsForFilterSort = async ({
  currentUserId,
  filters,
  options,
  sort,
}: {
  currentUserId: string;
  filters?: ChannelFilters;
  options?: ChannelOptions;
  sort?: SortParamRequest[];
}): Promise<DBGetChannelsForQueryResult | null> => {
  if (!filters && !sort && !options?.predefined_filter) {
    console.warn(
      'Please provide the query (filters/sort/options.predefined_filter) to fetch channels from the DB.',
    );
    return null;
  }

  SqliteClient.logger?.('info', 'getChannelsForFilterSort', { filters, options, sort });

  const cachedQuery = await selectChannelQueryForFilterSort({ filters, options, sort });

  if (!cachedQuery) {
    return null;
  }

  const { cids, predefinedFilter } = cachedQuery;

  if (cids.length === 0) {
    return { channels: [], predefinedFilter };
  }

  return {
    channels: await getChannels({
      channelIds: cids,
      currentUserId,
    }),
    predefinedFilter,
  };
};
