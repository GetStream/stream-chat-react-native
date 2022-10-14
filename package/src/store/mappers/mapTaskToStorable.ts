import type { PendingTask } from '../types';

export const mapTaskToStorable = (task: PendingTask) => ({
  ...task,
  payload: JSON.stringify(task.payload),
});
