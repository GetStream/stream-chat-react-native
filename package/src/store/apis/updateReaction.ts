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
  let storableUser: ReturnType<typeof mapUserToStorable> | undefined;

  if (reaction.user) {
    storableUser = mapUserToStorable(reaction.user);
    queries.push(createUpsertQuery('users', mapUserToStorable(reaction.user)));
  }

  const storableReaction = mapReactionToStorable(reaction);

  queries.push(
    createUpdateQuery('reactions', storableReaction, {
      messageId: reaction.message_id,
      userId: reaction.user_id,
    }),
  );

  let updatedReactionGroups: string | undefined;
  if (message.reaction_groups) {
    const { reactionGroups } = mapMessageToStorable(message);
    updatedReactionGroups = reactionGroups;
    queries.push(createUpdateQuery('messages', { reactionGroups }, { id: message.id }));
  }

  QuickSqliteClient.logger?.('info', 'updateReaction', {
    addedUser: storableUser,
    flush,
    updatedReaction: storableReaction,
    updatedReactionGroups,
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
