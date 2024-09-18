import debounce from 'lodash/debounce';
import type { Channel, ChannelMemberAPIResponse, StreamChat, User } from 'stream-chat';

import { defaultAutoCompleteSuggestionsLimit } from './constants';

import type { SuggestionUser } from '../contexts/suggestionsContext/SuggestionsContext';
import type { DefaultStreamChatGenerics } from '../types/types';

const getMembers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const members = channel.state.members;
  return members ? Object.values(members).map(({ user }) => user) : [];
};

const getWatchers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const watchers = channel.state.watchers;
  return watchers ? Object.values(watchers) : [];
};

export const getMembersAndWatchers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const members = getMembers(channel);
  const watchers = getWatchers(channel);
  const users = [...members, ...watchers];

  // make sure we don't list users twice
  const seenUsers = new Set<string>();
  const uniqueUsers: User[] = [];

  for (const user of users) {
    if (user && !seenUsers.has(user.id)) {
      uniqueUsers.push(user);
      seenUsers.add(user.id);
    }
  }

  return uniqueUsers;
};

const isUserResponse = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  user: SuggestionUser<StreamChatGenerics> | undefined,
): user is SuggestionUser<StreamChatGenerics> =>
  (user as SuggestionUser<StreamChatGenerics>) !== undefined;

export type QueryMembersFunction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = (
  client: StreamChat<StreamChatGenerics>,
  channel: Channel<StreamChatGenerics>,
  query: SuggestionUser<StreamChatGenerics>['name'],
  onReady?: (users: SuggestionUser<StreamChatGenerics>[]) => void,
  options?: {
    limit?: number;
  },
) => Promise<void>;

const queryMembers = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  client: StreamChat<StreamChatGenerics>,
  channel: Channel<StreamChatGenerics>,
  query: SuggestionUser<StreamChatGenerics>['name'],
  onReady?: (users: SuggestionUser<StreamChatGenerics>[]) => void,
  options: {
    limit?: number;
  } = {},
): Promise<void> => {
  if (!query) return;
  try {
    const { limit = defaultAutoCompleteSuggestionsLimit } = options;

    const { members } = (await (channel as unknown as Channel).queryMembers(
      {
        name: { $autocomplete: query },
      },
      {},
      { limit },
    )) as ChannelMemberAPIResponse<StreamChatGenerics>;

    const users: SuggestionUser<StreamChatGenerics>[] = [];
    members
      .filter((member) => member.user?.id !== client.userID)
      .forEach((member) => isUserResponse(member.user) && users.push(member.user));

    if (onReady && users) {
      onReady(users);
    }
  } catch (error) {
    console.warn('Error querying members:', error);
    throw error;
  }
};

export const queryMembersDebounced = debounce(queryMembers, 200, {
  leading: false,
  trailing: true,
});
