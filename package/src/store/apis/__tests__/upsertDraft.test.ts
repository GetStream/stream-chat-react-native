import type { DraftResponse, MessageResponse } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

import { generateChannelResponse } from '../../../mock-builders/generator/channel';
import { generateMessage } from '../../../mock-builders/generator/message';
import { BetterSqlite } from '../../../test-utils/BetterSqlite';
import { SqliteClient } from '../../SqliteClient';
import { getDraft } from '../getDraft';
import { upsertChannels } from '../upsertChannels';
import { upsertDraft } from '../upsertDraft';

describe('upsertDraft', () => {
  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
    jest.clearAllMocks();
  });

  it('stores the quoted and parent messages so the draft can be read back with them', async () => {
    const channelResponse = generateChannelResponse({ members: [], messages: [] });
    const cid = channelResponse.channel.cid as string;
    await upsertChannels({
      channels: [channelResponse] as unknown as Parameters<typeof upsertChannels>[0]['channels'],
    });

    const parentMessage = generateMessage({ cid, id: uuidv4() }) as unknown as MessageResponse;
    const quotedMessage = generateMessage({ cid, id: uuidv4() }) as unknown as MessageResponse;
    const draft = {
      channel_cid: cid,
      created_at: new Date().toISOString(),
      message: { id: uuidv4(), quoted_message_id: quotedMessage.id, text: 'draft text' },
      parent_id: parentMessage.id,
      parent_message: parentMessage,
      quoted_message: quotedMessage,
    } as unknown as DraftResponse;

    const queries = await upsertDraft({ draft });

    const messageUpserts = queries.filter(([query]) => query.includes('INTO messages'));
    expect(messageUpserts).toHaveLength(2);

    const messageIds = (await BetterSqlite.selectFromTable<{ id: string }>('messages')).map(
      ({ id }) => id,
    );
    expect(messageIds).toEqual(expect.arrayContaining([parentMessage.id, quotedMessage.id]));

    const storedDraft = await getDraft({ cid, parent_id: parentMessage.id, userId: uuidv4() });
    expect(storedDraft?.quoted_message?.id).toBe(quotedMessage.id);
  });
});
