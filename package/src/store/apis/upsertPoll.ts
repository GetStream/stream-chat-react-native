import { PollResponse } from 'stream-chat';

import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const upsertPoll = async ({
  execute = true,
  poll,
}: {
  poll: PollResponse;
  execute?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const storablePoll = mapPollToStorable(poll);

  queries.push(createUpsertQuery('poll', storablePoll));
  SqliteClient.logger?.('info', 'upsertPoll', {
    poll: storablePoll,
  });

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
