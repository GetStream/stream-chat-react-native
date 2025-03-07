import { isVoteAnswer, PollAnswer, PollResponse, PollVote } from 'stream-chat';

import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { mapStorableToPoll } from '../mappers/mapStorableToPoll';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries, TableRow } from '../types';

export const updatePollMessage = async ({
  eventType,
  flush = true,
  poll,
  poll_vote,
  userID,
}: {
  eventType: string;
  poll: PollResponse;
  userID: string;
  flush?: boolean;
  poll_vote?: PollVote | PollAnswer;
}) => {
  const queries: PreparedQueries[] = [];

  const pollsFromDB = await SqliteClient.executeSql.apply(
    null,
    createSelectQuery('poll', ['*'], {
      id: poll.id,
    }),
  );

  for (const pollFromDB of pollsFromDB) {
    const serializedPoll = mapStorableToPoll(pollFromDB as unknown as TableRow<'poll'>);
    const { latest_answers = [], own_votes = [] } = serializedPoll;
    let newOwnVotes = own_votes;
    if (poll_vote && poll_vote.user?.id === userID) {
      newOwnVotes =
        eventType === 'poll.vote_removed'
          ? newOwnVotes.filter((vote) => vote.id !== poll_vote.id)
          : [poll_vote, ...newOwnVotes.filter((vote) => vote.id !== poll_vote.id)];
    }
    let newLatestAnswers = latest_answers;
    if (poll_vote && isVoteAnswer(poll_vote)) {
      newLatestAnswers =
        eventType === 'poll.vote_removed'
          ? newLatestAnswers.filter((answer) => answer.id !== poll_vote?.id)
          : [poll_vote, ...newLatestAnswers.filter((answer) => answer.id !== poll_vote?.id)];
    }

    const storablePoll = mapPollToStorable({
      ...poll,
      latest_answers: newLatestAnswers,
      own_votes: newOwnVotes,
    });

    queries.push(
      createUpdateQuery('poll', storablePoll, {
        id: poll.id,
      }),
    );
    SqliteClient.logger?.('info', 'updatePoll', {
      poll: storablePoll,
    });
  }

  if (flush) {
    SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
