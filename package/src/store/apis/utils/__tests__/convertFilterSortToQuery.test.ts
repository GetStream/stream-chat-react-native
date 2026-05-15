import { convertFilterSortToQuery } from '../convertFilterSortToQuery';

describe('convertFilterSortToQuery', () => {
  it('preserves the existing filters and sort key for traditional queries', () => {
    const filters = { members: { $in: ['user-1'] }, type: 'messaging' };
    const sort = { last_updated: 1 as const };

    expect(convertFilterSortToQuery({ filters, sort })).toBe(
      JSON.stringify(`${JSON.stringify(filters)}-${JSON.stringify(sort)}`),
    );
  });

  it('uses predefined filter options in the query key', () => {
    const firstKey = convertFilterSortToQuery({
      options: {
        predefined_filter: 'user_messaging',
      },
      sort: [],
    });
    const secondKey = convertFilterSortToQuery({
      options: {
        predefined_filter: 'team_channels',
      },
      sort: [],
    });

    expect(firstKey).not.toBe(secondKey);
  });

  it('distinguishes predefined filter interpolation values', () => {
    const firstKey = convertFilterSortToQuery({
      options: {
        filter_values: { user_id: 'user-1' },
        predefined_filter: 'user_messaging',
        sort_values: { sort_field: 'last_message_at' },
      },
      sort: [],
    });
    const secondKey = convertFilterSortToQuery({
      options: {
        filter_values: { user_id: 'user-2' },
        predefined_filter: 'user_messaging',
        sort_values: { sort_field: 'last_message_at' },
      },
      sort: [],
    });

    expect(firstKey).not.toBe(secondKey);
  });

  it('ignores pagination and control options for predefined filter keys', () => {
    const firstKey = convertFilterSortToQuery({
      options: {
        limit: 10,
        offset: 0,
        predefined_filter: 'user_messaging',
        watch: true,
      },
      sort: [],
    });
    const secondKey = convertFilterSortToQuery({
      options: {
        limit: 20,
        offset: 20,
        predefined_filter: 'user_messaging',
        watch: false,
      },
      sort: [],
    });

    expect(firstKey).toBe(secondKey);
  });
});
