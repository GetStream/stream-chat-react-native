import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';

type PredefinedFilterCacheKeyOptions = Pick<
  ChannelOptions,
  'predefined_filter' | 'filter_values' | 'sort_values'
>;

const getPredefinedFilterOptions = (
  options?: ChannelOptions,
): PredefinedFilterCacheKeyOptions | undefined => {
  if (!options?.predefined_filter) {
    return undefined;
  }

  return {
    predefined_filter: options.predefined_filter,
    ...(options.filter_values !== undefined ? { filter_values: options.filter_values } : {}),
    ...(options.sort_values !== undefined ? { sort_values: options.sort_values } : {}),
  };
};

export const convertFilterSortToQuery = ({
  filters,
  options,
  sort,
}: {
  filters?: ChannelFilters;
  options?: ChannelOptions;
  sort?: ChannelSort;
}) => {
  const predefinedFilterOptions = getPredefinedFilterOptions(options);

  if (predefinedFilterOptions) {
    return JSON.stringify(
      `predefined-${JSON.stringify(predefinedFilterOptions)}-${sort ? JSON.stringify(sort) : ''}`,
    );
  }

  return JSON.stringify(
    `${filters ? JSON.stringify(filters) : ''}-${sort ? JSON.stringify(sort) : ''}`,
  );
};
