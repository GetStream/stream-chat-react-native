import debounce from 'lodash/debounce';
import type { Channel, ChannelMemberAPIResponse, StreamChat, User } from 'stream-chat';

import { defaultAutoCompleteSuggestionsLimit } from './constants';

import type { SuggestionUser } from '../contexts/suggestionsContext/SuggestionsContext';

const getMembers = (channel: Channel) => {
  const members = channel.state.members;
  return members ? Object.values(members).map(({ user }) => user) : [];
};

const getWatchers = (channel: Channel) => {
  const watchers = channel.state.watchers;
  return watchers ? Object.values(watchers) : [];
};

export const getMembersAndWatchers = (channel: Channel) => {
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

const isUserResponse = (user: SuggestionUser | undefined): user is SuggestionUser =>
  (user as SuggestionUser) !== undefined;

export type QueryMembersFunction = (
  client: StreamChat,
  channel: Channel,
  query: SuggestionUser['name'],
  onReady?: (users: SuggestionUser[]) => void,
  options?: {
    limit?: number;
  },
) => Promise<SuggestionUser[]>;

const queryMembers = async (
  client: StreamChat,
  channel: Channel,
  query: SuggestionUser['name'],
  onReady?: (users: SuggestionUser[]) => void,
  options: {
    limit?: number;
  } = {},
): Promise<SuggestionUser[]> => {
  if (!query) {
    return [];
  }
  try {
    const { limit = defaultAutoCompleteSuggestionsLimit } = options;

    const { members } = (await (channel as unknown as Channel).queryMembers(
      {
        name: { $autocomplete: query },
      },
      {},
      { limit },
    )) as ChannelMemberAPIResponse;

    const users: SuggestionUser[] = [];
    members
      .filter((member) => member.user?.id !== client.userID)
      .forEach((member) => isUserResponse(member.user) && users.push(member.user));

    if (onReady && users) {
      onReady(users);
    }
    return users;
  } catch (error) {
    console.warn('Error querying members:', error);
    throw error;
  }
};

export const queryMembersDebounced = debounce(queryMembers, 200, {
  leading: false,
  trailing: true,
});
