import type { ChannelFilters, ChannelSort } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const convertFilterSortToQuery = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  filters?: ChannelFilters<StreamChatGenerics>,
  sort?: ChannelSort<StreamChatGenerics>,
) => JSON.stringify(`${JSON.stringify(filters)}${JSON.stringify(sort)}`);
