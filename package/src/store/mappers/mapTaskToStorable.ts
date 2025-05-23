import type { PendingTask } from 'stream-chat';

export const mapTaskToStorable = (task: PendingTask) => ({
  ...task,
  createdAt: new Date().toISOString(),
  payload: JSON.stringify(task.payload),
});
