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
  /** Channel ids in the order the cached query produced them. */
  cids: string[];
  /** The backend-resolved predefined filter that order was produced by, when there was one. */
  predefinedFilter?: ParsedPredefinedFilterResponse;
};

/**
 * A stored `predefined_filter` response is only useful if it still describes a filter and,
 * optionally, a sort. Anything else in the column — a truncated write, a row left by an older
 * shape — is discarded rather than handed to the paginator, which would otherwise match and order
 * the whole list by a malformed rule.
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
 * Gets the cached result of a channel query from the database — the channel ids it produced and the
 * backend-resolved predefined filter that produced them.
 *
 * @param {Object} param
 * @param {Object} param.filters Filters for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 * @param {Object} param.options Full query options, which is what tells two predefined-filter queries apart
 * @param {Object} param.sort Sort for channels https://getstream.io/chat/docs/javascript/query_channels/?language=javascript&q=su#query-parameters
 *
 * @returns The cached query, or null if it doesn't exist in the "channelQueries" table.
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
