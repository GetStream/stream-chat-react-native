import type { ReadResponse } from 'stream-chat';

import { mapReadToStorable } from '../mappers/mapReadToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const upsertReads = async ({
  cid,
  execute = true,
  reads,
}: {
  cid: string;
  reads: ReadResponse[];
  execute?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const storableReads: Array<ReturnType<typeof mapReadToStorable>> = [];
  const storableUsers: Array<ReturnType<typeof mapUserToStorable>> = [];

  reads?.forEach((read) => {
    if (read.user) {
      storableUsers.push(mapUserToStorable(read.user));
    }
    storableReads.push(mapReadToStorable({ cid, read }));
  });

  queries.push(...storableUsers.map((storableUser) => createUpsertQuery('users', storableUser)));
  queries.push(...storableReads.map((storableRead) => createUpsertQuery('reads', storableRead)));

  SqliteClient.logger?.('info', 'upsertReads', {
    execute,
    reads: storableReads,
    users: storableUsers,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
