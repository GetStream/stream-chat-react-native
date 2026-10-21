import type { ReactionFilters, ReactionResponse, SortParamRequest } from 'stream-chat';

import { getReactions } from './getReactions';
import { selectReactionsForMessages } from './queries/selectReactionsForMessages';

import { SqliteClient } from '../SqliteClient';

/**
 * Fetches a message's reactions from the database, filtered and sorted.
 *
 * @param params.messageId The ID of the message to fetch reactions for.
 * @param params.filters Filters to apply. Only `type` is supported.
 * @param params.sort Sort to apply.
 * @param params.limit Maximum number of reactions to return. Defaults to 25.
 * @returns The reactions, or null when neither filters nor sort are given.
 */
export const getReactionsForFilterSort = async ({
  messageId,
  filters,
  sort,
  limit,
}: {
  messageId: string;
  filters?: Pick<ReactionFilters, 'type'>;
  sort?: SortParamRequest[];
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
