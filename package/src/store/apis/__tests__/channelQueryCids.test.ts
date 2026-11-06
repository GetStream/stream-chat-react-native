import { BetterSqlite } from '../../../test-utils/BetterSqlite';
import { SqliteClient } from '../../SqliteClient';
import { selectChannelQueryForFilterSort } from '../queries/selectChannelQueryForFilterSort';
import { upsertCidsForQuery } from '../upsertCidsForQuery';

describe('channel query cids', () => {
  const predefinedFilter = {
    name: 'user_messaging',
    filter: { archived: false },
    sort: [{ direction: -1 as const, field: 'pinned_at' }],
  };

  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
    jest.clearAllMocks();
  });

  it('stores separate cid lists for predefined filter queries with the same filters and sort', async () => {
    await upsertCidsForQuery({
      cids: ['messaging:channel-1'],
      filters: {},
      options: {
        predefined_filter: 'user_messaging',
      },
      sort: [],
    });
    await upsertCidsForQuery({
      cids: ['messaging:channel-2'],
      filters: {},
      options: {
        predefined_filter: 'team_channels',
      },
      sort: [],
    });

    await expect(
      selectChannelQueryForFilterSort({
        filters: {},
        options: {
          predefined_filter: 'user_messaging',
        },
        sort: [],
      }),
    ).resolves.toEqual({ cids: ['messaging:channel-1'], predefinedFilter: undefined });
    await expect(
      selectChannelQueryForFilterSort({
        filters: {},
        options: {
          predefined_filter: 'team_channels',
        },
        sort: [],
      }),
    ).resolves.toEqual({ cids: ['messaging:channel-2'], predefinedFilter: undefined });
  });

  it('round-trips the backend-resolved rule alongside the order it produced', async () => {
    await upsertCidsForQuery({
      cids: ['messaging:channel-1'],
      filters: {},
      options: { predefined_filter: 'user_messaging' },
      predefinedFilter,
      sort: [],
    });

    await expect(
      selectChannelQueryForFilterSort({
        filters: {},
        options: { predefined_filter: 'user_messaging' },
        sort: [],
      }),
    ).resolves.toEqual({ cids: ['messaging:channel-1'], predefinedFilter });
  });

  it('clears a stored rule when the same query is re-cached without one', async () => {
    const query = {
      filters: {},
      options: { predefined_filter: 'user_messaging' },
      sort: [],
    };
    await upsertCidsForQuery({ ...query, cids: ['messaging:channel-1'], predefinedFilter });

    // The upsert builder drops undefined columns, so an omitted rule has to be written as an
    // explicit null — otherwise it would outlive the order it described.
    await upsertCidsForQuery({ ...query, cids: ['messaging:channel-2'] });

    await expect(selectChannelQueryForFilterSort(query)).resolves.toEqual({
      cids: ['messaging:channel-2'],
      predefinedFilter: undefined,
    });
  });

  it.each([
    ['unparseable', '{"name":"user_messaging"'],
    ['valid JSON of the wrong shape', '{"filter":{"archived":false}}'],
  ])('surfaces the cid order but ignores a stored rule that is %s', async (_, stored) => {
    const query = {
      filters: {},
      options: { predefined_filter: 'user_messaging' },
      sort: [],
    };
    await upsertCidsForQuery({ ...query, cids: ['messaging:channel-1'], predefinedFilter });
    await SqliteClient.executeSql('UPDATE channelQueries SET predefinedFilter = ?', [stored]);

    await expect(selectChannelQueryForFilterSort(query)).resolves.toEqual({
      cids: ['messaging:channel-1'],
      predefinedFilter: undefined,
    });
  });
});
