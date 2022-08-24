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

  reads?.forEach((read) => {
    if (read.user) {
      queries.push(createUpsertQuery('users', mapUserToStorable(read.user)));
    }

    queries.push(
      createUpsertQuery(
        'reads',
        mapReadToStorable({
          cid,
          read,
        }),
      ),
    );
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
