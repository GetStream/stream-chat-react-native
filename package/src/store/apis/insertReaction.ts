import type { FormatMessageResponse, MessageResponse, ReactionResponse } from 'stream-chat';

import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpdateQuery } from '../sqlite-utils/createUpdateQuery';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const insertReaction = ({
  flush = true,
  message,
  reaction,
}: {
  message: MessageResponse | FormatMessageResponse;
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

  QuickSqliteClient.logger?.('info', 'insertReaction', {
    flush,
    reaction: storableReaction,
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
