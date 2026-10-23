import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { generateMessage } from '../../mock-builders/generator/message';
import { BetterSqlite } from '../../test-utils/BetterSqlite';
import { selectMessagesForChannels } from '../apis/queries/selectMessagesForChannels';
import { upsertChannels } from '../apis/upsertChannels';
import { SqliteClient } from '../SqliteClient';

/**
 * The client treats the cached page as a `queryChannels` page of 25 messages, so a shorter one reads
 * as the start of the channel and older messages never load from the server.
 */
describe('selectMessagesForChannels', () => {
  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
  });

  it("returns a channel's newest 25 messages, oldest first", async () => {
    const channelResponse = generateChannelResponse({ members: [], messages: [] });
    const cid = channelResponse.channel.cid as string;
    const messages = Array.from({ length: 30 }, (_, i) =>
      generateMessage({ cid, timestamp: Date.UTC(2020, 0, 1, 0, i) }),
    );
    channelResponse.messages = messages as unknown as typeof channelResponse.messages;
    await upsertChannels({
      channels: [channelResponse] as unknown as Parameters<typeof upsertChannels>[0]['channels'],
      isLatestMessagesSet: true,
    });

    const rows = await selectMessagesForChannels([cid]);

    expect(rows.map((row) => row.id)).toEqual(messages.slice(-25).map((message) => message.id));
  });
});
