import type { SharedLocationResponse } from 'stream-chat';

import { mapSharedLocationToStorable } from '../mappers/mapSharedLocationToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const upsertLocation = async ({
  execute = true,
  location,
}: {
  location: SharedLocationResponse;
  execute?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  queries.push(createUpsertQuery('locations', mapSharedLocationToStorable(location)));

  SqliteClient.logger?.('info', 'upsertLocation', {
    cid: location.channel_cid,
    execute,
    location,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
