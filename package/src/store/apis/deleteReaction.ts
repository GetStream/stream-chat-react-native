import { FormatMessageResponse, MessageResponse, ReactionResponse } from 'stream-chat';

import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';
import { PreparedQueries } from '../types';

export const deleteReaction = async ({
  execute = true,
  message,
  reaction,
}: {
  reaction: ReactionResponse;
  message?: MessageResponse | FormatMessageResponse;
  execute?: boolean;
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

  if (execute) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
