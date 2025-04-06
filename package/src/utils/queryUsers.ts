import debounce from 'lodash/debounce';
import type { StreamChat } from 'stream-chat';

import { defaultAutoCompleteSuggestionsLimit, defaultMentionAllAppUsersQuery } from './constants';

import type { MentionAllAppUsersQuery } from '../contexts/messageInputContext/MessageInputContext';
import type { SuggestionUser } from '../contexts/suggestionsContext/SuggestionsContext';

export type QueryUsersFunction = (
  client: StreamChat,
  query: SuggestionUser['name'],
  onReady?: (users: SuggestionUser[]) => void,
  options?: {
    limit?: number;
    mentionAllAppUsersQuery?: MentionAllAppUsersQuery;
  },
) => Promise<SuggestionUser[]>;

const queryUsers = async (
  client: StreamChat,
  query: SuggestionUser['name'],
  onReady?: (users: SuggestionUser[]) => void,
  options: {
    limit?: number;
    mentionAllAppUsersQuery?: MentionAllAppUsersQuery;
  } = {},
): Promise<SuggestionUser[]> => {
  if (!query) {
    return [];
  }
  try {
    const {
      limit = defaultAutoCompleteSuggestionsLimit,
      mentionAllAppUsersQuery = defaultMentionAllAppUsersQuery,
    } = options;

    const filters = {
      $or: [{ id: { $autocomplete: query } }, { name: { $autocomplete: query } }],
      ...mentionAllAppUsersQuery?.filters,
    };

    const { users } = await client.queryUsers(
      // @ts-ignore
      filters,
      { id: 1, ...mentionAllAppUsersQuery?.sort },
      { limit, ...mentionAllAppUsersQuery?.options },
    );
    const usersWithoutClientUserId = users.filter((user) => user.id !== client.userID);
    if (onReady && users) {
      onReady(usersWithoutClientUserId);
    }
    return usersWithoutClientUserId;
  } catch (error) {
    console.warn('Error querying users:', error);
    throw error;
  }
};

export const queryUsersDebounced = debounce(queryUsers, 200, {
  leading: false,
  trailing: true,
});
