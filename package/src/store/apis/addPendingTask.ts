import type { PendingTask } from 'stream-chat';

import { mapTaskToStorable } from '../mappers/mapTaskToStorable';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

/**
 * Adds a pending task to the database.
 *
 * @param task The task to add.
 * @returns A function that removes the task from the database.
 */
export const addPendingTask = async (task: PendingTask) => {
  const storable = mapTaskToStorable(task);
  const { channelId, channelType, threadId, payload, type } = storable;
  const queries: PreparedQueries[] = [];
  if (type === 'create-draft' || type === 'delete-draft') {
    // One draft task is kept per entity (thread, channel, ...): the last one wins, since deleting a
    // draft that does not exist does not fail.
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
