import { Channel } from 'stream-chat';

import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { SqliteClient } from '../SqliteClient';
import { PreparedQueries } from '../types';

export const deleteReaction = async ({
  channel,
  flush = true,
  messageId,
  reactionType,
  userId,
}: {
  channel: Channel;
  messageId: string;
  reactionType: string;
  userId: string;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const message = channel.state.messages.find(({ id }) => id === messageId);

  if (!message) {
    return;
  }

  queries.push(
    createDeleteQuery('reactions', {
      messageId,
      type: reactionType,
      userId,
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
    messageId,
    type: reactionType,
    userId,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
