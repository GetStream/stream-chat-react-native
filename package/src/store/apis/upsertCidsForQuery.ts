import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';

import { convertFilterSortToQuery } from './utils/convertFilterSortToQuery';

import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertCidsForQuery = async ({
  cids,
  filters,
  execute = true,
  options,
  sort,
}: {
  cids: string[];
  filters?: ChannelFilters;
  execute?: boolean;
  options?: ChannelOptions;
  sort?: ChannelSort;
}) => {
  // Update the database only if the query is provided.
  const cidsString = JSON.stringify(cids);
  const id = convertFilterSortToQuery({ filters, options, sort });
  const query = createUpsertQuery('channelQueries', {
    cids: cidsString,
    id,
  });

  SqliteClient.logger?.('info', 'upsertCidsForQuery', {
    cids: cidsString,
    execute,
    id,
  });

  if (execute) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
