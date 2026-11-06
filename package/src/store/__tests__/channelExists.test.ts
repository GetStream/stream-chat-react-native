import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { BetterSqlite } from '../../test-utils/BetterSqlite';
import { channelExists } from '../apis/channelExists';
import { upsertChannels } from '../apis/upsertChannels';
import { SqliteClient } from '../SqliteClient';

/**
 * Runs against real SQLite rather than a mocked DB on purpose: the bug this guards was in the SQL
 * itself, so a mock that answers `true`/`false` on command would have kept passing forever.
 */
describe('channelExists', () => {
  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
  });

  it('reports false for a channel the database does not have', async () => {
    expect(await channelExists({ cid: 'messaging:never-persisted' })).toBe(false);
  });

  it('reports true for a channel the database does have', async () => {
    const channelResponse = generateChannelResponse({ members: [], messages: [] });
    await upsertChannels({
      channels: [channelResponse] as unknown as Parameters<typeof upsertChannels>[0]['channels'],
    });

    expect(await channelExists({ cid: channelResponse.channel.cid as string })).toBe(true);
  });

  it('distinguishes one channel from another', async () => {
    const persisted = generateChannelResponse({ members: [], messages: [] });
    await upsertChannels({
      channels: [persisted] as unknown as Parameters<typeof upsertChannels>[0]['channels'],
    });

    expect(await channelExists({ cid: persisted.channel.cid as string })).toBe(true);
    expect(await channelExists({ cid: 'messaging:some-other-channel' })).toBe(false);
  });
});
