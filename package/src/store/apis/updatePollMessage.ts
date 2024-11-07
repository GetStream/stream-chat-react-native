import type { PollResponse } from 'stream-chat';

import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import type { PreparedQueries } from '../types';

export const updatePollMessage = ({
  flush = true,
  poll,
}: {
  poll: PollResponse;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const pollsFromDB = QuickSqliteClient.executeSql.apply(
    null,
    createSelectQuery('poll', ['*'], {
      id: poll.id,
    }),
  );

  for (const pollFromDB of pollsFromDB) {
    const { latest_votes, own_votes } = pollFromDB;
    console.log(own_votes);
    const storablePoll = mapPollToStorable({
      ...pollFromDB,
      latest_votes: latest_votes ? JSON.parse(latest_votes) : [],
      own_votes: own_votes ? JSON.parse(own_votes) : [],
    });

    queries.push(
      createUpdateQuery('poll', storablePoll, {
        id: poll.id,
      }),
    );
    QuickSqliteClient.logger?.('info', 'updatePoll', {
      poll: storablePoll,
    });
  }

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
