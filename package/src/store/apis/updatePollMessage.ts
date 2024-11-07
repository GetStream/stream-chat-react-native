import type { PollResponse } from 'stream-chat';

import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { mapStorableToPoll } from '../mappers/mapStorableToPoll';
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
    const serializedPoll = mapStorableToPoll(pollFromDB);
    const { latest_votes, own_votes } = serializedPoll;
    console.log(own_votes);
    const storablePoll = mapPollToStorable({
      ...poll,
      // latest_votes: latest_votes ?? [],
      // own_votes: own_votes ?? [],
    });

    console.log('STORABLE POLL: ', storablePoll);

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
