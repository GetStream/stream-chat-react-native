import { mapTaskToStorable } from '../mappers/mapTaskToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PendingTask } from '../types';

export const addPendingTask = (task: PendingTask) => {
  const storable = mapTaskToStorable(task);
  const query = createUpsertQuery('pendingTasks', storable);

  QuickSqliteClient.executeSql.apply(null, query);

  return () => {
    const { channelId, channelType, payload, type } = storable;
    const query = createDeleteQuery('pendingTasks', {
      channelId,
      channelType,
      payload,
      type,
    });

    QuickSqliteClient.executeSql.apply(null, query);
  };
};
