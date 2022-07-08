import type { ChannelFilters, ChannelSort } from 'stream-chat';

import { convertFilterSortToQuery } from './utils/convertFilterSortToQuery';

import type { DefaultStreamChatGenerics } from '../../types/types';

import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';

export const upsertCidsForQuery = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cids,
  filters,
  flush = true,
  sort,
}: {
  cids: string[];
  filters?: ChannelFilters<StreamChatGenerics>;
  flush?: boolean;
  sort?: ChannelSort<StreamChatGenerics>;
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
