import type { ChannelFilters, ChannelSort } from 'stream-chat';

import { convertFilterSortToQuery } from './utils/convertFilterSortToQuery';

import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

export const upsertCidsForQuery = async ({
  cids,
  filters,
  flush = true,
  sort,
}: {
  cids: string[];
  filters?: ChannelFilters;
  flush?: boolean;
  sort?: ChannelSort;
}) => {
  // Update the database only if the query is provided.
  const cidsString = JSON.stringify(cids);
  const id = convertFilterSortToQuery({ filters, sort });
  const query = createUpsertQuery('channelQueries', {
    cids: cidsString,
    id,
  });

  SqliteClient.logger?.('info', 'upsertCidsForQuery', {
    cids: cidsString,
    flush,
    id,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
