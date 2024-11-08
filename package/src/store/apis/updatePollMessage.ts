import { isVoteAnswer, PollAnswer, PollResponse, PollVote } from 'stream-chat';

import { DefaultStreamChatGenerics } from '../../types/types';
import { mapPollToStorable } from '../mappers/mapPollToStorable';
import { mapStorableToPoll } from '../mappers/mapStorableToPoll';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createSelectQuery } from '../sqlite-utils/createSelectQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import type { PreparedQueries } from '../types';

export const updatePollMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  eventType,
  flush = true,
  poll,
  poll_vote,
  userID,
}: {
  eventType: string;
  poll: PollResponse<StreamChatGenerics>;
  userID: string;
  flush?: boolean;
  poll_vote?: PollVote<StreamChatGenerics> | PollAnswer<StreamChatGenerics>;
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
    QuickSqliteClient.logger?.('info', 'updatePoll', {
      poll: storablePoll,
    });
  }

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
