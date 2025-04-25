import { FormatMessageResponse, MessageResponse, ReactionResponse } from 'stream-chat';

import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';
import { PreparedQueries } from '../types';

export const deleteReaction = async ({
  flush = true,
  message,
  reaction,
}: {
  reaction: ReactionResponse;
  message?: MessageResponse | FormatMessageResponse;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  if (!message) {
    return [];
  }

  queries.push(
    createDeleteQuery('reactions', {
      messageId: reaction.message_id,
      type: reaction.type,
      userId: reaction.user_id,
    }),
  );

  const stringifiedNewReactionGroups = JSON.stringify(message.reaction_groups);

  queries.push(
    createUpdateQuery(
      'messages',
      {
        reactionGroups: stringifiedNewReactionGroups,
      },
      { id: message.id },
    ),
  );

  SqliteClient.logger?.('info', 'deleteReaction', {
    reaction,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
