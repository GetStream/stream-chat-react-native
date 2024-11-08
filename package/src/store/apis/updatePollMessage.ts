import { isVoteAnswer, PollAnswer, PollResponse, PollVote, StreamChat } from 'stream-chat';

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
  client,
  flush = true,
  poll,
  poll_vote,
}: {
  client: StreamChat<StreamChatGenerics>;
  poll: PollResponse<StreamChatGenerics>;
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
    const newOwnVotes =
      poll_vote && poll_vote.user?.id === client.userID
        ? [poll_vote, ...own_votes.filter((vote) => vote.id !== poll_vote.id)]
        : own_votes;
    const newLatestAnswers =
      poll_vote && isVoteAnswer(poll_vote)
        ? [poll_vote, ...latest_answers.filter((answer) => answer.id !== poll_vote?.id)]
        : latest_answers;
    const storablePoll = mapPollToStorable({
      ...poll,
      latest_answers: newLatestAnswers,
      own_votes: newOwnVotes,
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
