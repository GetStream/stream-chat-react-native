import type { PendingTask, TableRowJoinedUser } from '../types';

export const mapStorableToTask = (row: TableRowJoinedUser<'pendingTasks'>): PendingTask => {
  const { channelId, channelType, id, messageId, type } = row;
  return {
    channelId,
    channelType,
    id,
    messageId,
    payload: JSON.parse(row.payload),
    type,
  };
};
