import { PendingTask } from 'stream-chat';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToTask = (row: TableRowJoinedUser<'pendingTasks'>): PendingTask => {
  const { channelId, channelType, threadId, id, messageId, type } = row;
  return {
    channelId,
    channelType,
    id,
    messageId,
    payload: JSON.parse(row.payload),
    threadId,
    type,
  };
};
