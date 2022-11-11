import type { PendingTask } from '../types';

export const mapTaskToStorable = (task: PendingTask) => ({
  ...task,
  createdAt: new Date().toISOString(),
  payload: JSON.stringify(task.payload),
});
