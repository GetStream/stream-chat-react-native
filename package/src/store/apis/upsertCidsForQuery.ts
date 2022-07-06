import type { ChannelFilters, ChannelSort } from 'stream-chat';

import { convertFilterSortToQuery } from './utils/convertFilterSortToQuery';

import type { DefaultStreamChatGenerics } from '../../types/types';

import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { executeQueries } from '../sqlite-utils/executeQueries';

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
    executeQueries([query]);
  }

  return [query];
};
