import type { ChannelFilters, ChannelSort } from 'stream-chat';

export const convertFilterSortToQuery = ({
  filters,
  sort,
}: {
  filters?: ChannelFilters;
  sort?: ChannelSort;
}) =>
  JSON.stringify(`${filters ? JSON.stringify(filters) : ''}-${sort ? JSON.stringify(sort) : ''}`);
