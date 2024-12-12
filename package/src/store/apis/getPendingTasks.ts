import { mapStorableToTask } from '../mappers/mapStorableToTask';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { SqliteClient } from '../SqliteClient';
import type { TableRowJoinedUser } from '../types';

export const getPendingTasks = async (conditions: { messageId?: string } = {}) => {
  const query = createSelectQuery('pendingTasks', ['*'], conditions, {
    createdAt: 1,
  });

  SqliteClient.logger?.('info', 'getPendingTasks', { conditions });
  const result = await SqliteClient.executeSql.apply(null, query);

  return result.map((r: TableRowJoinedUser<'pendingTasks'>) => mapStorableToTask(r));
};
