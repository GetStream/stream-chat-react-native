import type { ChannelAPIResponse, ChannelFilters, ChannelSort } from 'stream-chat';

import { getChannels } from './getChannels';
import { selectChannelIdsForFilterSort } from './queries/selectChannelIdsForFilterSort';

import { SqliteClient } from '../SqliteClient';

/**
 * Gets the channels from database for given filter and sort query.
 *
 * @param {Object} param
 * @param {string} param.currentUserId Id of current logged in user
 * @param {Object} param.filters Filters for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 * @param {Object} param.sort Sort for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 *
 * @returns Array of channels corresponding to filters & sort. Returns null if filters + sort query doesn't exist in "channelQueries" table.
 */
export const getChannelsForFilterSort = async ({
  currentUserId,
  filters,
  sort,
}: {
  currentUserId: string;
  filters?: ChannelFilters;
  sort?: ChannelSort;
}): Promise<Omit<ChannelAPIResponse, 'duration'>[] | null> => {
  if (!filters && !sort) {
    console.warn('Please provide the query (filters/sort) to fetch channels from DB');
    return null;
  }

  SqliteClient.logger?.('info', 'getChannelsForFilterSort', { filters, sort });

  const channelIds = await selectChannelIdsForFilterSort({ filters, sort });

  if (!channelIds) {
    return null;
  }

  if (channelIds.length === 0) {
    return [];
  }

  return await getChannels({
    channelIds,
    currentUserId,
  });
};
