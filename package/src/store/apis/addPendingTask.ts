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
  const { channelId, channelType, threadId, payload, type } = storable;
  const queries = [];
  if (type === 'create-draft' || type === 'delete-draft') {
    // Only one draft pending task is allowed per entity (i.e thread, channel etc).
    // If multiple arrive, we'll simply take the last one (since deleteDraft does not
    // fail as an API if a draft doesn't exist).
    queries.push(
      createDeleteQuery('pendingTasks', {
        channelId,
        channelType,
        threadId,
        type: ['create-draft', 'delete-draft'],
      }),
    );
  }
  queries.push(createUpsertQuery('pendingTasks', storable));
  SqliteClient.logger?.('info', 'addPendingTask', {
    channelId,
    channelType,
    id: task.id,
    type,
  });

  await SqliteClient.executeSqlBatch(queries);

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

    await SqliteClient.executeSqlBatch([query]);
  };
};
