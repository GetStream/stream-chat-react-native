import { BetterSqlite } from '../../../test-utils/BetterSqlite';
import { SqliteClient } from '../../SqliteClient';
import { selectChannelIdsForFilterSort } from '../queries/selectChannelIdsForFilterSort';
import { upsertCidsForQuery } from '../upsertCidsForQuery';

describe('channel query cids', () => {
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
      sort: {},
    });
    await upsertCidsForQuery({
      cids: ['messaging:channel-2'],
      filters: {},
      options: {
        predefined_filter: 'team_channels',
      },
      sort: {},
    });

    await expect(
      selectChannelIdsForFilterSort({
        filters: {},
        options: {
          predefined_filter: 'user_messaging',
        },
        sort: {},
      }),
    ).resolves.toEqual(['messaging:channel-1']);
    await expect(
      selectChannelIdsForFilterSort({
        filters: {},
        options: {
          predefined_filter: 'team_channels',
        },
        sort: {},
      }),
    ).resolves.toEqual(['messaging:channel-2']);
  });
});
