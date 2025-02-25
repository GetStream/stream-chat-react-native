import type { ReactionFilters, ReactionResponse, ReactionSort } from 'stream-chat';

import { getReactions } from './getReactions';
import { selectReactionsForMessages } from './queries/selectReactionsForMessages';

import type { DefaultStreamChatGenerics } from '../../types/types';

import { SqliteClient } from '../SqliteClient';

/**
 * Fetches reactions for a message from the database based on the provided filters and sort.
 * @param currentMessageId The message ID for which reactions are to be fetched.
 * @param filters The filters to be applied while fetching reactions.
 * @param sort The sort to be applied while fetching reactions.
 */
export const getReactionsForFilterSort = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  currentMessageId,
  filters,
  sort,
}: {
  currentMessageId: string;
  filters?: ReactionFilters<StreamChatGenerics>;
  sort?: ReactionSort<StreamChatGenerics>;
}): Promise<ReactionResponse<StreamChatGenerics>[] | null> => {
  if (!filters && !sort) {
    console.warn('Please provide the query (filters/sort) to fetch channels from DB');
    return null;
  }

  SqliteClient.logger?.('info', 'getReactionsForFilterSort', { filters, sort });

  const reactions = await selectReactionsForMessages([currentMessageId]);

  if (!reactions) {
    return null;
  }

  if (reactions.length === 0) {
    return [];
  }

  const filteredReactions = reactions.filter((reaction) => reaction.type === filters?.type);

  return getReactions({ reactions: filteredReactions });
};
