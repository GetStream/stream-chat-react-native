import type { LocalMessage, MarkGroupResponse, TimestampNS } from 'stream-chat';

import { generateChannelResponse } from '../../mock-builders/generator/channel';
import { generateMessage } from '../../mock-builders/generator/message';
import { generateUser } from '../../mock-builders/generator/user';
import { BetterSqlite } from '../../test-utils/BetterSqlite';
import { deleteMessage } from '../apis/deleteMessage';
import { getMessageMarks } from '../apis/getMessageMarks';
import { insertMessageMark } from '../apis/insertMessageMark';
import { updateMessage } from '../apis/updateMessage';
import { upsertChannels } from '../apis/upsertChannels';
import { upsertMessages } from '../apis/upsertMessages';
import { mapStorableToMessage } from '../mappers/mapStorableToMessage';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { SqliteClient } from '../SqliteClient';

/** Runs against real SQLite: the marks hang off `messages` by a foreign key. */
describe('message marks', () => {
  const cid = 'messaging:marks';
  const ava = generateUser({ id: 'ava', name: 'Ava' });
  const ben = generateUser({ id: 'ben', name: 'Ben' });

  const markGroup = (...markers: Array<[string, number]>): MarkGroupResponse => ({
    count: markers.length,
    latest_by: markers.map(([user_id, createdAt]) => ({
      created_at: createdAt as TimestampNS,
      user_id,
    })),
  });

  const store = async (messages: LocalMessage[]) => {
    const channelResponse = generateChannelResponse({ members: [], messages: [] });
    channelResponse.channel.cid = cid;
    await upsertChannels({
      channels: [channelResponse] as unknown as Parameters<typeof upsertChannels>[0]['channels'],
    });
    await upsertMessages({ messages });
  };

  const userIds = (marks: Awaited<ReturnType<typeof getMessageMarks>>) =>
    marks.map((mark) => mark.user_id);

  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
  });

  it("stores a message's markers and reads them newest first, with their users", async () => {
    await store([
      generateMessage({ cid, id: 'from-ava', user: ava }),
      generateMessage({ cid, id: 'from-ben', user: ben }),
      generateMessage({
        cid,
        id: 'voice',
        mark_groups: {
          'acme.viewed': markGroup(['ava', 5]),
          played: markGroup(['ben', 3], ['ava', 2], ['cleo', 1]),
        },
      }),
    ]);

    const marks = await getMessageMarks({ messageId: 'voice' });

    expect(marks.map(({ type, user_id }) => `${user_id}:${type}`)).toEqual([
      'ava:acme.viewed',
      'ben:played',
      'ava:played',
      'cleo:played',
    ]);
    expect(marks[1]).toMatchObject({
      created_at: 3,
      message_id: 'voice',
      user: { id: 'ben', name: 'Ben' },
    });
    // No user stored for this marker: the mark still lists, under the user's ID.
    expect(marks[3].user.id).toBe('cleo');
  });

  it('reads one type, up to the limit', async () => {
    await store([
      generateMessage({
        cid,
        id: 'voice',
        mark_groups: {
          'acme.viewed': markGroup(['ava', 5]),
          played: markGroup(['ben', 3], ['ava', 2], ['cleo', 1]),
        },
      }),
    ]);

    const marks = await getMessageMarks({
      filter: { type: 'played' },
      limit: 2,
      messageId: 'voice',
    });

    expect(userIds(marks)).toEqual(['ben', 'ava']);
  });

  it('adds the markers of an updated message to the ones stored', async () => {
    const message = generateMessage({
      cid,
      id: 'voice',
      mark_groups: { played: markGroup(['ava', 1]) },
    });
    await store([message]);

    await updateMessage({
      message: { ...message, mark_groups: { played: markGroup(['ben', 2], ['ava', 1]) } },
    });

    expect(userIds(await getMessageMarks({ messageId: 'voice' }))).toEqual(['ben', 'ava']);
  });

  it("stores the message's mark groups in their own column and reads them back", async () => {
    const groups = { played: markGroup(['ben', 3], ['ava', 2]) };
    await store([generateMessage({ cid, id: 'voice', mark_groups: groups, user: ava })]);

    const [row] = (await BetterSqlite.selectFromTable('messages')) as Array<
      Parameters<typeof mapStorableToMessage>[0]['messageRow']
    >;

    expect(JSON.parse(row.markGroups)).toEqual(groups);
    expect(JSON.parse(row.extraData)).not.toHaveProperty('mark_groups');
    const message = mapStorableToMessage({
      messageRow: { ...row, user: mapUserToStorable(ava) },
      pollRow: undefined as never,
      userId: 'ava',
    });
    expect(message.mark_groups).toEqual(groups);
    expect(message).not.toHaveProperty('markGroups');
  });

  it('reads no mark groups for a message stored without them', async () => {
    await store([generateMessage({ cid, id: 'text', user: ava })]);

    const [row] = (await BetterSqlite.selectFromTable('messages')) as Array<
      Parameters<typeof mapStorableToMessage>[0]['messageRow']
    >;
    const message = mapStorableToMessage({
      messageRow: { ...row, user: mapUserToStorable(ava) },
      pollRow: undefined as never,
      userId: 'ava',
    });

    expect(message).not.toHaveProperty('mark_groups');
  });

  it('deletes the marks with their message', async () => {
    await store([
      generateMessage({ cid, id: 'voice', mark_groups: { played: markGroup(['ava', 1]) } }),
    ]);

    await deleteMessage({ id: 'voice' });

    expect(await getMessageMarks({ messageId: 'voice' })).toEqual([]);
  });

  it('stores no marks for a thread reply, which is not stored itself', async () => {
    await store([
      generateMessage({ cid, id: 'parent' }),
      generateMessage({
        cid,
        id: 'reply',
        mark_groups: { played: markGroup(['ava', 1]) },
        parent_id: 'parent',
      }),
    ]);

    expect(await BetterSqlite.selectFromTable('messageMarks')).toHaveLength(0);
  });

  describe('insertMessageMark', () => {
    const cleo = generateUser({ id: 'cleo', name: 'Cleo' });
    const played = (user_id: string, createdAt: number, message_id = 'voice') => ({
      created_at: createdAt as TimestampNS,
      message_id,
      type: 'played',
      user_id,
    });
    const storedRow = async (id: string) =>
      ((await BetterSqlite.selectFromTable('messages')) as Array<Record<string, string>>).find(
        (row) => row.id === id,
      )!;

    it("stores the mark, its user and the message's mark groups, leaving the rest", async () => {
      const message = generateMessage({
        cid,
        id: 'voice',
        mark_groups: { played: markGroup(['ava', 1]) },
        text: 'listen',
        user: ben,
      });
      await store([message]);

      await insertMessageMark({
        mark: played('cleo', 2),
        message: {
          ...message,
          mark_groups: { played: markGroup(['cleo', 2], ['ava', 1]) },
          text: 'not written',
        },
        user: cleo,
      });

      const marks = await getMessageMarks({ messageId: 'voice' });
      expect(marks.map(({ user }) => user.name ?? user.id)).toEqual(['Cleo', 'ava']);
      const row = await storedRow('voice');
      expect(JSON.parse(row.markGroups)).toEqual({ played: markGroup(['cleo', 2], ['ava', 1]) });
      expect(row.text).toBe('listen');
    });

    it("stores the current user's own mark on another user's message", async () => {
      const message = generateMessage({ cid, id: 'voice', user: ben });
      await store([message]);
      const ownMarks = [{ created_at: 3 as TimestampNS, type: 'played' }];

      await insertMessageMark({
        mark: played('ava', 3),
        message: { ...message, own_marks: ownMarks },
      });

      expect(JSON.parse((await storedRow('voice')).ownMarks)).toEqual(ownMarks);
      expect(userIds(await getMessageMarks({ messageId: 'voice' }))).toEqual(['ava']);
    });

    it('skips a message the database never held, without aborting the rest of the batch', async () => {
      const message = generateMessage({ cid, id: 'voice', user: ben });
      await store([message]);
      const orphan = await insertMessageMark({
        execute: false,
        mark: played('cleo', 2, 'never-stored'),
        message: { id: 'never-stored' } as Parameters<typeof insertMessageMark>[0]['message'],
      });
      const valid = await insertMessageMark({
        execute: false,
        mark: played('cleo', 2),
        message,
      });

      await expect(SqliteClient.executeSqlBatch([...orphan, ...valid])).resolves.not.toThrow();

      expect(userIds(await getMessageMarks({ messageId: 'voice' }))).toEqual(['cleo']);
      expect(await getMessageMarks({ messageId: 'never-stored' })).toEqual([]);
    });
  });
});
