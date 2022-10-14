import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PendingTask } from '../types';

export const addPendingTask = ({ channelId, channelType, payload, type }: PendingTask) => {
  const query = createUpsertQuery('pendingTasks', {
    channelId,
    channelType,
    createdAt: new Date().toISOString(),
    payload: JSON.stringify(payload),
    type,
  });

  QuickSqliteClient.executeSql.apply(null, query);

  return () => {
    const query = createDeleteQuery('pendingTasks', {
      channelId,
      channelType,
      payload: JSON.stringify(payload),
      type,
    });

    QuickSqliteClient.executeSql.apply(null, query);
  };
};
