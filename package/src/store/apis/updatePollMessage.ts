import type { PollResponse } from 'stream-chat';

import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const updatePollMessage = async ({
  flush = true,
  poll,
}: {
  poll: PollResponse;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const messagesWithPoll = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('messages', ['*'], {
      poll_id: poll.id,
    }),
  );

  for (const message of messagesWithPoll) {
    const storablePoll = JSON.stringify({
      ...poll,
      latest_votes: message.poll.latest_votes,
      own_votes: message.poll.own_votes,
    });
    const storableMessage = { ...message, poll: storablePoll };

    queries.push(
      createUpdateQuery('messages', storableMessage, {
        id: message.id,
      }),
    );
    SqliteClient.logger?.('info', 'updatePoll', {
      message: storableMessage,
      poll: storablePoll,
    });
  }

  if (flush) {
    SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
