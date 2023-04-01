import { QuickSqliteClient } from '../QuickSqliteClient';
import { createDeleteQuery } from '../sqlite-utils/createDeleteQuery';

export const deleteReaction = ({
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

  if (flush) {
    QuickSqliteClient.executeSql.apply(null, query);
  }

  return [query];
};
