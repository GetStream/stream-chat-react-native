import type { ChannelAPIResponse } from 'stream-chat';

import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { generateMessage } from '../../mock-builders/generator/message';
import { BetterSqlite } from '../../test-utils/BetterSqlite';
import { getChannels } from '../apis/getChannels';
import { selectMessagesForChannels } from '../apis/queries/selectMessagesForChannels';
import { upsertChannels } from '../apis/upsertChannels';
import { SqliteClient } from '../SqliteClient';

/**
 * The client reads the cached page as a channel list page of `message_limit` messages, so a page of
 * a different size makes it guess wrongly whether older messages exist, for example that a channel
 * with a long history starts at its cached messages.
 */
describe('selectMessagesForChannels', () => {
  let cid: string;
  let messages: ReturnType<typeof generateMessage>[];

  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();

    const channelResponse = generateChannelResponse({ members: [], messages: [] });
    cid = channelResponse.channel.cid as string;
    messages = Array.from({ length: 30 }, (_, i) =>
      generateMessage({ cid, timestamp: new Date(Date.UTC(2020, 0, 1, 0, i)) }),
    );
    channelResponse.messages = messages as unknown as typeof channelResponse.messages;
    await upsertChannels({
      channels: [channelResponse] as unknown as ChannelAPIResponse[],
      isLatestMessagesSet: true,
    });
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
  });

  const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

  it("returns a channel's newest 25 messages, oldest first, by default", async () => {
    const rows = await selectMessagesForChannels([cid]);

    expect(ids(rows)).toEqual(ids(messages.slice(-25)));
  });

  it("returns a channel's newest `messageLimit` messages", async () => {
    expect(ids(await selectMessagesForChannels([cid], 10))).toEqual(ids(messages.slice(-10)));
    expect(ids(await selectMessagesForChannels([cid], 50))).toEqual(ids(messages));
  });

  it('applies the limit that getChannels is given', async () => {
    const [channel] = await getChannels({
      channelIds: [cid],
      currentUserId: 'some-user',
      messageLimit: 10,
    });

    expect(ids(channel.messages)).toEqual(ids(messages.slice(-10)));
  });
});
