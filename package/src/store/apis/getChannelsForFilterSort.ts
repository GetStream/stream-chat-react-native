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
 * Gets the cached channels for a filter, sort and options query.
 *
 * @param params.userId The ID of the current user.
 * @param params.filters Channel filters: https://getstream.io/chat/docs/javascript/query_channels/
 * @param params.options Query options, including `predefined_filter`.
 * @param params.sort Channel sort: https://getstream.io/chat/docs/javascript/query_channels/
 * @returns The channels with the predefined-filter metadata they were cached with, or null when
 * no query is given or it is not in the `channelQueries` table.
 */
export const getChannelsForFilterSort = async ({
  userId,
  filters,
  options,
  sort,
}: {
  userId: string;
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
      userId,
    }),
    predefinedFilter,
  };
};
