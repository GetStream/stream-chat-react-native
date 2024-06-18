import type { ReactionResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { mapStorableToReaction } from '../mappers/mapStorableToReaction';
import { QuickSqliteClient } from '../QuickSqliteClient';
import { TableRowJoinedUser } from '../types';

export const getReactions = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  reactions,
}: {
  reactions: TableRowJoinedUser<'reactions'>[];
}): ReactionResponse<StreamChatGenerics>[] => {
  QuickSqliteClient.logger?.('info', 'getReactions', { reactions });

  // Enrich the channels with state
  return reactions.map((reaction) => ({
    ...mapStorableToReaction<StreamChatGenerics>(reaction),
  }));
};
