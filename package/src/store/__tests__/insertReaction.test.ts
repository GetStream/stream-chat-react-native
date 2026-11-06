import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { generateMessage } from '../../mock-builders/generator/message';
import { generateReaction } from '../../mock-builders/generator/reaction';
import { BetterSqlite } from '../../test-utils/BetterSqlite';
import { insertReaction } from '../apis/insertReaction';
import { updateReaction } from '../apis/updateReaction';
import { upsertChannels } from '../apis/upsertChannels';
import { upsertMessages } from '../apis/upsertMessages';
import { SqliteClient } from '../SqliteClient';

/**
 * Runs against real SQLite rather than a mocked DB on purpose: what this guards is a foreign key
 * declared in the schema, and a mocked `executeSqlBatch` accepts any statement you hand it.
 */
describe('reaction writes when the message is not cached', () => {
  const cid = 'messaging:reaction-guard';

  const cacheAMessage = async (id: string) => {
    const channelResponse = generateChannelResponse({ members: [], messages: [] });
    channelResponse.channel.cid = cid;
    await upsertChannels({
      channels: [channelResponse] as unknown as Parameters<typeof upsertChannels>[0]['channels'],
    });
    const message = generateMessage({ cid, id });
    await upsertMessages({
      messages: [message] as unknown as Parameters<typeof upsertMessages>[0]['messages'],
    });
    return message;
  };

  const storedReactions = () => BetterSqlite.selectFromTable('reactions');

  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
  });

  it('inserts the reaction when the message is cached', async () => {
    const message = await cacheAMessage('cached-message');
    const reaction = generateReaction({ message_id: message.id, type: 'love' });

    await insertReaction({ message, reaction });

    expect(await storedReactions()).toHaveLength(1);
  });

  // The failure this closes: a `/sync` replay carrying a reaction on a message outside the cached
  // window aborted the whole batch with `FOREIGN KEY constraint failed`, so all 45 unrelated events
  // in it were lost too.
  it('skips the reaction, without throwing, when the message was never cached', async () => {
    await cacheAMessage('some-other-message');
    const reaction = generateReaction({ message_id: 'never-persisted', type: 'love' });

    await expect(
      insertReaction({
        message: { id: 'never-persisted', reaction_groups: {} } as Parameters<
          typeof insertReaction
        >[0]['message'],
        reaction,
      }),
    ).resolves.not.toThrow();

    expect(await storedReactions()).toHaveLength(0);
  });

  it('does not abort the rest of the batch it shares', async () => {
    const message = await cacheAMessage('cached-message');
    const orphanQueries = await insertReaction({
      execute: false,
      message: { id: 'never-persisted', reaction_groups: {} } as Parameters<
        typeof insertReaction
      >[0]['message'],
      reaction: generateReaction({ message_id: 'never-persisted', type: 'like' }),
    });
    const validQueries = await insertReaction({
      execute: false,
      message,
      reaction: generateReaction({ message_id: message.id, type: 'love' }),
    });

    await SqliteClient.executeSqlBatch([...orphanQueries, ...validQueries]);

    // The orphan is dropped and the reaction that had a parent still lands.
    expect(await storedReactions()).toHaveLength(1);
  });

  it('applies the same guard to updateReaction', async () => {
    await cacheAMessage('some-other-message');
    const reaction = generateReaction({ message_id: 'never-persisted', type: 'love' });

    await expect(
      updateReaction({
        message: { id: 'never-persisted', reaction_groups: {} } as Parameters<
          typeof updateReaction
        >[0]['message'],
        reaction,
      }),
    ).resolves.not.toThrow();

    expect(await storedReactions()).toHaveLength(0);
  });
});
