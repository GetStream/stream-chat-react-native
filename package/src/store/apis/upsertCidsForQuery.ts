import type {
  ChannelFilters,
  ChannelOptions,
  ParsedPredefinedFilterResponse,
  SortParamRequest,
} from 'stream-chat';

import { convertFilterSortToQuery } from './utils/convertFilterSortToQuery';

import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertCidsForQuery = async ({
  cids,
  filters,
  execute = true,
  options,
  predefinedFilter,
  sort,
}: {
  cids: string[];
  filters?: ChannelFilters;
  execute?: boolean;
  options?: ChannelOptions;
  predefinedFilter?: ParsedPredefinedFilterResponse;
  sort?: SortParamRequest[];
}) => {
  // Update the database only if the query is provided.
  const cidsString = JSON.stringify(cids);
  const id = convertFilterSortToQuery({ filters, options, sort });
  const predefinedFilterString = predefinedFilter ? JSON.stringify(predefinedFilter) : null;
  const query = createUpsertQuery('channelQueries', {
    cids: cidsString,
    id,
    predefinedFilter: predefinedFilterString,
  });

  SqliteClient.logger?.('info', 'upsertCidsForQuery', {
    cids: cidsString,
    execute,
    id,
    predefinedFilter: predefinedFilterString,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
