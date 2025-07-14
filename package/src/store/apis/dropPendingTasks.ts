import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

/**
 * dropPendingTasks - Drops all pending tasks from the DB given a specific messageId.
 * Useful for when we do some message actions on a failed message and then we decide to
 * delete it afterwards, removing it from the state.
 *
 * @param {Object} param
 * @param {string} param.messageId The messageId for which we want to remove the pending tasks.
 * @param {boolean} param.execute Whether we should immediately execute the query or return it as a prepared one.
 *
 * @return {() => void} - A function that can be called to remove the task from the database
 */
export const dropPendingTasks = async ({
  messageId,
  execute = true,
}: {
  messageId: string;
  execute?: boolean;
}) => {
  const queries = [createDeleteQuery('pendingTasks', { messageId })];
  SqliteClient.logger?.('info', 'dropPendingTasks', {
    messageId,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
