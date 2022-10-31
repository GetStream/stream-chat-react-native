import type { PendingTask, TableRowJoinedUser } from '../types';

export const mapStorableToTask = (row: TableRowJoinedUser<'pendingTasks'>): PendingTask => {
  const { channelId, channelType, id, type } = row;
  return {
    channelId,
    channelType,
    id,
    payload: JSON.parse(row.payload),
    type,
  };
};
