import type { ReactionResponse } from 'stream-chat';

import { mapReactionToStorable } from '../mappers/mapReactionToStorable';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { createUpsertQuery } from '../sqlite-utils/createUpsertQuery';
import type { PreparedQueries } from '../types';

export const insertReaction = ({
  flush = true,
  reaction,
}: {
  reaction: ReactionResponse;
  flush?: boolean;
}) => {
  const queries: PreparedQueries[] = [];

  const storableReaction = mapReactionToStorable(reaction);

  queries.push(createUpsertQuery('reactions', storableReaction));

  queries.push([
    'UPDATE messages SET reactionCounts = reactionCounts + 1 WHERE id = ?',
    [reaction.message_id],
  ]);

  QuickSqliteClient.logger?.('info', 'insertReaction', {
    flush,
    reaction: storableReaction,
  });

  if (flush) {
    QuickSqliteClient.executeSqlBatch(queries);
  }

  return queries;
};
