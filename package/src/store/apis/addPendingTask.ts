import type { PendingTask } from 'stream-chat';

import { mapTaskToStorable } from '../mappers/mapTaskToStorable';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';

/*
 * addPendingTask - Adds a pending task to the database
 *
 * @param {PendingTask} task - The task to add
 *
 * @return {() => void} - A function that can be called to remove the task from the database
 */
export const addPendingTask = async (task: PendingTask) => {
  const storable = mapTaskToStorable(task);
  const { channelId, channelType, payload, type } = storable;
  const query = createUpsertQuery('pendingTasks', storable);
  SqliteClient.logger?.('info', 'addPendingTask', {
    channelId,
    channelType,
    id: task.id,
    type,
  });

  await SqliteClient.executeSql.apply(null, query);

  return async () => {
    SqliteClient.logger?.('info', 'deletePendingTaskAfterAddition', {
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

    await SqliteClient.executeSql.apply(null, query);
  };
};
