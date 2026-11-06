import type { ReactionResponse } from 'stream-chat';

import { mapStorableToReaction } from '../mappers/mapStorableToReaction';
import { SqliteClient } from '../SqliteClient';
import { TableRowJoinedUser } from '../types';

export const getReactions = ({
  reactions,
}: {
  reactions: TableRowJoinedUser<'reactions'>[];
}): ReactionResponse[] => {
  SqliteClient.logger?.('info', 'getReactions', { reactions });

  return reactions.map((reaction) => ({
    ...mapStorableToReaction(reaction),
  }));
};
