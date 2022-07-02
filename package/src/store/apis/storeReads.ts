import type { ReadResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapReadToStorable } from '../mappers/mapReadToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createInsertQuery } from '../utils/createInsertQuery';
import { executeQueries } from '../utils/executeQueries';

export const storeReads = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  cid,
  flush = true,
  reads,
}: {
  cid: string;
  reads: ReadResponse<StreamChatGenerics>[];
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  reads?.forEach((read) => {
    if (read.user) {
      queries.push(createInsertQuery('users', mapUserToStorable(read.user)));
    }

    queries.push(
      createInsertQuery(
        'reads',
        mapReadToStorable({
          cid,
          read,
        }),
      ),
    );
  });

  if (flush) {
    executeQueries(queries);
  }

  return queries;
};
