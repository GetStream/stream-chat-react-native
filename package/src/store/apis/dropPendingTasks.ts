import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

/**
 * Drops all pending tasks of a message, for example when a failed message that had actions queued
 * on it is deleted.
 *
 * @param params.messageId The ID of the message whose pending tasks are removed.
 * @param params.execute Whether to run the query now or only return it. Defaults to true.
 * @returns The prepared delete queries.
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
