import type { DBUpdatePendingTaskType } from 'stream-chat';

import { mapTaskToStorable } from '../mappers/mapTaskToStorable';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';

export const updatePendingTask = async ({ id, task }: DBUpdatePendingTaskType) => {
  const storableTask = mapTaskToStorable(task);
  const { createdAt, id: taskId, ...nextTask } = storableTask;
  void createdAt;
  void taskId;

  const query = createUpdateQuery('pendingTasks', nextTask, {
    id,
  });

  SqliteClient.logger?.('info', 'updatePendingTask', {
    id,
    task: nextTask,
  });

  await SqliteClient.executeSql.apply(null, query);

  return [query];
};
