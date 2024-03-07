import type { ReadResponse } from 'stream-chat';

import { mapReadToStorable } from '../mappers/mapReadToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const upsertReads = ({
  cid,
  flush = true,
  reads,
}: {
  cid: string;
  reads: ReadResponse[];
  flush?: boolean;
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

  QuickSqliteClient.logger?.('info', 'upsertReads', {
    flush,
    reads: storableReads,
    users: storableUsers,
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
