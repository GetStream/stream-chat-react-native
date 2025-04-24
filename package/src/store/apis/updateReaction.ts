import type { LocalMessage, MessageResponse, ReactionResponse } from 'stream-chat';

import { mapMessageToStorable } from '../mappers/mapMessageToStorable';
import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { mapUserToStorable } from '../mappers/mapUserToStorable';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const updateReaction = async ({
  flush = true,
  message,
  reaction,
}: {
  message: MessageResponse | LocalMessage;
  reaction: ReactionResponse;
  flush?: boolean;
}) => {
  console.log('EXECUTING UPDATE');
  const queries: PreparedQueries[] = [];
  let storableUser: ReturnType<typeof mapUserToStorable> | undefined;

  if (reaction.user) {
    storableUser = mapUserToStorable(reaction.user);
    queries.push(createUpsertQuery('users', mapUserToStorable(reaction.user)));
  }

  const storableReaction = mapReactionToStorable(reaction);

  queries.push(
    createDeleteQuery('reactions', {
      messageId: reaction.message_id,
      userId: reaction.user_id,
    }),
  );
  queries.push(createUpsertQuery('reactions', storableReaction));

  let updatedReactionGroups: string | undefined;
  if (message.reaction_groups) {
    const { reactionGroups } = mapMessageToStorable(message);
    updatedReactionGroups = reactionGroups;
    queries.push(createUpdateQuery('messages', { reactionGroups }, { id: message.id }));
  }

  SqliteClient.logger?.('info', 'updateReaction', {
    addedUser: storableUser,
    flush,
    updatedReaction: storableReaction,
    updatedReactionGroups,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
