import type { LocalMessage, MessageResponse, ReactionResponse } from 'stream-chat';

import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import { SqliteClient } from '../SqliteClient';
import type { PreparedQueries } from '../types';

export const insertReaction = async ({
  flush = true,
  message,
  reaction,
}: {
  message: MessageResponse | LocalMessage;
  reaction: ReactionResponse;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const storableReaction = mapReactionToStorable(reaction);

  queries.push(createUpsertQuery('reactions', storableReaction));

  const stringifiedNewReactionGroups = JSON.stringify(message.reaction_groups);

  queries.push(
    createUpdateQuery(
      'messages',
      {
        reactionGroups: stringifiedNewReactionGroups,
      },
      { id: reaction.message_id },
    ),
  );

  SqliteClient.logger?.('info', 'insertReaction', {
    flush,
    reaction: storableReaction,
  });

  if (flush) {
    await SqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
