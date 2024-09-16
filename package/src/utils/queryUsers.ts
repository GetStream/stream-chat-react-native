import debounce from 'lodash/debounce';
import type { StreamChat } from 'stream-chat';

import { defaultAutoCompleteSuggestionsLimit, defaultMentionAllAppUsersQuery } from './constants';

import type { MentionAllAppUsersQuery } from '../contexts/messageInputContext/MessageInputContext';
import type { SuggestionUser } from '../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultStreamChatGenerics } from '../types/types';

export type QueryUsersFunction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = (
  client: StreamChat<StreamChatGenerics>,
  query: SuggestionUser<StreamChatGenerics>['name'],
  onReady?: (users: SuggestionUser<StreamChatGenerics>[]) => void,
  options?: {
    limit?: number;
    mentionAllAppUsersQuery?: MentionAllAppUsersQuery<StreamChatGenerics>;
  },
) => Promise<void>;

const queryUsers = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
  query: SuggestionUser<StreamChatGenerics>['name'],
  onReady?: (users: SuggestionUser<StreamChatGenerics>[]) => void,
  options: {
    limit?: number;
    mentionAllAppUsersQuery?: MentionAllAppUsersQuery<StreamChatGenerics>;
  } = {},
): Promise<void> => {
  if (!query) return;
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
  } catch (error) {
    console.warn('Error querying users:', error);
    throw error;
  }
};

export const queryUsersDebounced = debounce(queryUsers, 200, {
  leading: false,
  trailing: true,
});
