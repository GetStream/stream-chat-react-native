import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';
import { SqliteClient } from '../SqliteClient';

export const deleteReaction = async ({
  flush = true,
  messageId,
  reactionType,
  userId,
}: {
  messageId: string;
  reactionType: string;
  userId: string;
  flush?: boolean;
}) => {
  const query = createDeleteQuery('reactions', {
    messageId,
    type: reactionType,
    userId,
  });

  SqliteClient.logger?.('info', 'deleteReaction', {
    messageId,
    type: reactionType,
    userId,
  });

  if (flush) {
    await SqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
