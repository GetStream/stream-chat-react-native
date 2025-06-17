import { PendingTask } from 'stream-chat';

import type { TableRowJoinedUser } from '../types';

export const mapStorableToTask = (row: TableRowJoinedUser<'pendingTasks'>): PendingTask => {
  const { channelId, channelType, parentId, id, messageId, type } = row;
  return {
    channelId,
    channelType,
    id,
    messageId,
    parentId,
    payload: JSON.parse(row.payload),
    type,
  };
};
