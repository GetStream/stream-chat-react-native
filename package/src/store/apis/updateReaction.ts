import type { MessageResponse, ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import type { PreparedQueries } from '../types';
import { createUpdateQuery } from '../utils/createUpdateQuery';
import { createUpsertQuery } from '../utils/createUpsertQuery';
import { executeQueries } from '../utils/executeQueries';
import { selectQuery } from '../utils/selectQuery';

export const updateReaction = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  flush = true,
  message,
  reaction,
}: {
  message: MessageResponse<StreamChatGenerics>;
  reaction: ReactionResponse<StreamChatGenerics>;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  if (reaction.user) {
    queries.push(createUpsertQuery('users', mapUserToStorable(reaction.user)));
  }

  queries.push(
    createUpdateQuery('reactions', mapReactionToStorable<StreamChatGenerics>(reaction), {
      messageId: reaction.message_id,
      userId: reaction.user_id,
    }),
  );

  if (message.reaction_counts) {
    queries.push(
      createUpdateQuery(
        'messages',
        mapMessageToStorable({
          reaction_counts: message.reaction_counts,
        }),
        {
          id: message.id,
        },
      ),
    );
  }

  if (flush) {
    executeQueries(queries);

    setTimeout(() => {
      const result = selectQuery('select userId, type from reactions where messageId = ?', [
        reaction.message_id,
      ]);
      console.log(result);
    }, 2000);
  }

  return queries;
};
