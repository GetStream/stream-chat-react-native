import type { PendingTask } from 'stream-chat';
import { v4 as uuidv4 } from 'uuid';

import { addPendingTask, getPendingTasks, updatePendingTask } from '..';
import { generateMessage } from '../../../mock-builders/generator/message';
import { BetterSqlite } from '../../../test-utils/BetterSqlite';
import { SqliteClient } from '../../SqliteClient';

describe('updatePendingTask', () => {
  beforeEach(async () => {
    await SqliteClient.initializeDatabase();
    await BetterSqlite.openDB();
  });

  afterEach(() => {
    BetterSqlite.dropAllTables();
    BetterSqlite.closeDB();
    jest.clearAllMocks();
  });

  it('should replace an existing pending task row by id without changing its createdAt ordering', async () => {
    const channelId = uuidv4();
    const originalMessage = generateMessage({
      cid: `messaging:${channelId}`,
      id: uuidv4(),
      text: 'original text',
    });

    await addPendingTask({
      channelId,
      channelType: 'messaging',
      messageId: originalMessage.id,
      payload: [originalMessage, {}],
      type: 'send-message',
    } as unknown as PendingTask);

    const [originalRow] = await BetterSqlite.selectFromTable<{
      id: number;
      createdAt: string;
      type: string;
      payload: string;
    }>('pendingTasks');
    const [originalTask] = await getPendingTasks({ messageId: originalMessage.id });

    const editedMessage = {
      ...originalMessage,
      text: 'edited text',
    };

    await updatePendingTask({
      id: originalTask.id as number,
      task: {
        channelId,
        channelType: 'messaging',
        messageId: originalMessage.id,
        payload: [editedMessage, {}],
        type: 'send-message',
      } as unknown as PendingTask,
    });

    const [updatedRow] = await BetterSqlite.selectFromTable<{
      id: number;
      createdAt: string;
      type: string;
      payload: string;
    }>('pendingTasks');
    const [updatedTask] = await getPendingTasks({ messageId: originalMessage.id });

    expect(updatedRow.id).toBe(originalRow.id);
    expect(updatedRow.createdAt).toBe(originalRow.createdAt);
    expect(updatedRow.type).toBe('send-message');
    expect(JSON.parse(updatedRow.payload)[0].text).toBe('edited text');
    expect(updatedTask.id).toBe(originalTask.id);
    expect(updatedTask.type).toBe('send-message');
    expect((updatedTask.payload as [{ text: string }, object])[0].text).toBe('edited text');
  });
});
