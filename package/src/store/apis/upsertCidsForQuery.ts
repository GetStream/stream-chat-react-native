import type { ChannelFilters, ChannelSort } from 'stream-chat';

import { convertFilterSortToQuery } from './utils/convertFilterSortToQuery';

import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertCidsForQuery = ({
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
  const query = createUpsertQuery('channelQueries', {
    cids: JSON.stringify(cids),
    id: convertFilterSortToQuery({ filters, sort }),
  });

  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
