import { mapTaskToStorable } from '../mappers/mapTaskToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PendingTask } from '../types';

/*
 * addPendingTask - Adds a pending task to the database
 *
 * @param {PendingTask} task - The task to add
 *
 * @return {() => void} - A function that can be called to remove the task from the database
 */
export const addPendingTask = (task: PendingTask) => {
  const storable = mapTaskToStorable(task);
  const { channelId, channelType, payload, type } = storable;
  const query = createUpsertQuery('pendingTasks', storable);
  QuickSqliteClient.logger?.('info', 'addPendingTask', {
    channelId,
    channelType,
    id: task.id,
    type,
  });

  QuickSqliteClient.executeSql.apply(null, query);

  return () => {
    QuickSqliteClient.logger?.('info', 'deletePendingTaskAfterAddition', {
      channelId,
      channelType,
      id: task.id,
      type,
    });
    const query = createDeleteQuery('pendingTasks', {
      channelId,
      channelType,
      payload,
      type,
    });

    QuickSqliteClient.executeSql.apply(null, query);
  };
};
