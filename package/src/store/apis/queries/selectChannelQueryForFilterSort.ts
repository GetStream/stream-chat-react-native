import type {
  ChannelFilters,
  ChannelOptions,
  ParsedPredefinedFilterResponse,
  SortParamRequest,
} from 'stream-chat';

import { createSelectQuery } from '../../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../../SqliteClient';

import { convertFilterSortToQuery } from '../utils/convertFilterSortToQuery';

export type CachedChannelQuery = {
  /** Channel IDs in the order the cached query produced them. */
  cids: string[];
  /** The server-resolved predefined filter that produced the order, if any. */
  predefinedFilter?: ParsedPredefinedFilterResponse;
};

/**
 * Whether a stored `predefined_filter` value still describes a filter and, optionally, a sort.
 * Anything else (such as a truncated write) is discarded, so the paginator never matches and
 * orders the list by a malformed rule.
 */
const isPredefinedFilterResponse = (value: unknown): value is ParsedPredefinedFilterResponse => {
  if (typeof value !== 'object' || value === null) return false;
  const { name, filter, sort } = value as Record<string, unknown>;
  return (
    typeof name === 'string' &&
    typeof filter === 'object' &&
    filter !== null &&
    (sort === undefined || Array.isArray(sort))
  );
};

const parsePredefinedFilter = (
  serialized: string | null | undefined,
): ParsedPredefinedFilterResponse | undefined => {
  if (!serialized) return undefined;
  try {
    const parsed = JSON.parse(serialized);
    return isPredefinedFilterResponse(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Gets the cached result of a channel query: the channel IDs it produced and the server-resolved
 * predefined filter behind them, or null when the query is not in the `channelQueries` table. The
 * full `options` are part of the query key, as they tell two predefined-filter queries apart.
 *
 * @param params.filters Channel filters: https://getstream.io/chat/docs/javascript/query_channels/
 * @param params.options Query options, including `predefined_filter`.
 * @param params.sort Channel sort: https://getstream.io/chat/docs/javascript/query_channels/
 * @returns The cached query, or null when it is not cached.
 */

export const selectChannelQueryForFilterSort = async ({
  filters,
  options,
  sort,
}: {
  filters?: ChannelFilters;
  options?: ChannelOptions;
  sort?: SortParamRequest[];
}): Promise<CachedChannelQuery | null> => {
  const query = convertFilterSortToQuery({ filters, options, sort });

  SqliteClient.logger?.('info', 'selectChannelQueryForFilterSort', {
    query,
  });

  const results = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('channelQueries', ['*'], {
      id: query,
    }),
  );

  const channelIdsStr = results?.[0]?.cids;
  if (!channelIdsStr) return null;

  return {
    cids: JSON.parse(channelIdsStr),
    predefinedFilter: parsePredefinedFilter(results?.[0]?.predefinedFilter),
  };
};
