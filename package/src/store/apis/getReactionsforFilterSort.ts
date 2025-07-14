import type { ReactionFilters, ReactionResponse, ReactionSort } from 'stream-chat';

import { getReactions } from './getReactions';
import { selectReactionsForMessages } from './queries/selectReactionsForMessages';

import { SqliteClient } from '../SqliteClient';

/**
 * Fetches reactions for a message from the database based on the provided filters and sort.
 * @param currentMessageId The message ID for which reactions are to be fetched.
 * @param filters The filters to be applied while fetching reactions.
 * @param sort The sort to be applied while fetching reactions.
 * @param limit The limit of how many reactions should be returned.
 */
export const getReactionsForFilterSort = async ({
  messageId,
  filters,
  sort,
  limit,
}: {
  messageId: string;
  filters?: Pick<ReactionFilters, 'type'>;
  sort?: ReactionSort;
  limit?: number;
}): Promise<ReactionResponse[] | null> => {
  if (!filters && !sort) {
    console.warn('Please provide the query (filters/sort) to fetch channels from DB');
    return null;
  }

  SqliteClient.logger?.('info', 'getReactionsForFilterSort', { filters, sort });

  const reactions = await selectReactionsForMessages([messageId], limit, filters, sort);

  if (!reactions) {
    return null;
  }

  if (reactions.length === 0) {
    return [];
  }

  return getReactions({ reactions });
};
