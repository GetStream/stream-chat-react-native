import type { FormatMessageResponse, MessageResponse, ReactionResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const updateReaction = ({
  flush = true,
  message,
  reaction,
}: {
  message: MessageResponse | FormatMessageResponse;
  reaction: ReactionResponse;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  if (reaction.user) {
    queries.push(createUpsertQuery('users', mapUserToStorable(reaction.user)));
  }

  queries.push(
    createUpdateQuery('reactions', mapReactionToStorable(reaction), {
      messageId: reaction.message_id,
      userId: reaction.user_id,
    }),
  );

  if (message.reaction_counts) {
    const { reactionCounts } = mapMessageToStorable(message);

    queries.push(
      createUpdateQuery(
        'messages',
        {
          reactionCounts,
        },
        {
          id: message.id,
        },
      ),
    );
  }

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
