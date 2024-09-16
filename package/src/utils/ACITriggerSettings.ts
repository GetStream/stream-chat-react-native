import type { DebouncedFunc } from 'lodash';
import type { Channel, CommandResponse, StreamChat } from 'stream-chat';

import { defaultAutoCompleteSuggestionsLimit, defaultMentionAllAppUsersQuery } from './constants';
import { getMembersAndWatchers, queryMembersDebounced, QueryMembersFunction } from './queryMembers';
import { queryUsersDebounced, QueryUsersFunction } from './queryUsers';

import type {
  EmojiSearchIndex,
  MentionAllAppUsersQuery,
} from '../contexts/messageInputContext/MessageInputContext';
import type {
  SuggestionCommand,
  SuggestionComponentType,
  SuggestionUser,
} from '../contexts/suggestionsContext/SuggestionsContext';
import { Emoji } from '../emoji-data';
import type { DefaultStreamChatGenerics } from '../types/types';

const getCommands = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => channel.getConfig()?.commands || [];

export type TriggerSettingsOutputType = {
  caretPosition: string;
  key: string;
  text: string;
};

export type TriggerSettings<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  '/'?: {
    dataProvider: (
      query: CommandResponse<StreamChatGenerics>['name'],
      text: string,
      onReady?: (
        data: CommandResponse<StreamChatGenerics>[],
        q: CommandResponse<StreamChatGenerics>['name'],
      ) => void,
      options?: {
        limit?: number;
      },
    ) => SuggestionCommand<StreamChatGenerics>[];
    output: (entity: CommandResponse<StreamChatGenerics>) => TriggerSettingsOutputType;
    type: SuggestionComponentType;
  };
  ':'?: {
    dataProvider: (
      query: Emoji['name'],
      _: string,
      onReady?: (data: Emoji[], q: Emoji['name']) => void,
    ) => Emoji[] | Promise<Emoji[]>;
    output: (entity: Emoji) => TriggerSettingsOutputType;
    type: SuggestionComponentType;
  };
  '@'?: {
    callback: (item: SuggestionUser<StreamChatGenerics>) => void;
    dataProvider: (
      query: SuggestionUser<StreamChatGenerics>['name'],
      _: string,
      onReady?: (
        data: SuggestionUser<StreamChatGenerics>[],
        q: SuggestionUser<StreamChatGenerics>['name'],
      ) => void,
      options?: {
        limit?: number;
        mentionAllAppUsersEnabled?: boolean;
        mentionAllAppUsersQuery?: MentionAllAppUsersQuery<StreamChatGenerics>;
      },
    ) => SuggestionUser<StreamChatGenerics>[] | Promise<void> | void;
    output: (entity: SuggestionUser<StreamChatGenerics>) => TriggerSettingsOutputType;
    type: SuggestionComponentType;
  };
};

export type ACITriggerSettingsParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  channel: Channel<StreamChatGenerics>;
  client: StreamChat<StreamChatGenerics>;
  onMentionSelectItem: (item: SuggestionUser<StreamChatGenerics>) => void;
  emojiSearchIndex?: EmojiSearchIndex;
};

export const isCommandTrigger = (trigger: Trigger): trigger is '/' => trigger === '/';

export const isEmojiTrigger = (trigger: Trigger): trigger is ':' => trigger === ':';

export const isMentionTrigger = (trigger: Trigger): trigger is '@' => trigger === '@';

export type Trigger = '/' | '@' | ':';

/**
 * ACI = AutoCompleteInput
 *
 * DataProvider accepts `onReady` function, which will execute once the data is ready.
 * Another approach would have been to simply return the data from dataProvider and let the
 * component await for it and then execute the required logic. We are going for callback instead
 * of async-await since we have debounce function in dataProvider. Which will delay the execution
 * of api call on trailing end of debounce (lets call it a1) but will return with result of
 * previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
 * end of debounce executes.
 */
export const ACITriggerSettings = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  channel,
  client,
  emojiSearchIndex,
  onMentionSelectItem,
}: ACITriggerSettingsParams<StreamChatGenerics>): TriggerSettings<StreamChatGenerics> => ({
  '/': {
    dataProvider: (query, text, onReady, options = {}) => {
      try {
        if (text.indexOf('/') !== 0) return [];

        const { limit = defaultAutoCompleteSuggestionsLimit } = options;
        const selectedCommands = !query
          ? getCommands(channel)
          : getCommands(channel).filter((command) => query && command.name?.indexOf(query) !== -1);

        // sort alphabetically unless the you're matching the first char
        selectedCommands.sort((a, b) => {
          let nameA = a.name?.toLowerCase() || '';
          let nameB = b.name?.toLowerCase() || '';
          if (query && nameA.indexOf(query) === 0) {
            nameA = `0${nameA}`;
          }
          if (query && nameB.indexOf(query) === 0) {
            nameB = `0${nameB}`;
          }
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;

          return 0;
        });

        const result = selectedCommands.slice(0, limit);

        if (onReady) {
          onReady(result, query);
        }

        return result;
      } catch (error) {
        console.warn('Error querying commands while using "/":', error);
        throw error;
      }
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: `${entity.name}`,
      text: `/${entity.name}`,
    }),
    type: 'command',
  },
  ':': {
    dataProvider: async (query, _, onReady) => {
      try {
        if (!query) return [];

        const emojis = (await emojiSearchIndex?.search(query)) ?? [];

        if (onReady) {
          onReady(emojis, query);
        }

        return emojis;
      } catch (error) {
        console.warn('Error querying emojis while using ":":', error);
        throw error;
      }
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.name,
      text: entity.unicode,
    }),
    type: 'emoji',
  },
  '@': {
    callback: (item) => {
      onMentionSelectItem(item);
    },
    dataProvider: (
      query,
      _,
      onReady,
      options = {
        limit: defaultAutoCompleteSuggestionsLimit,
        mentionAllAppUsersEnabled: false,
        mentionAllAppUsersQuery: defaultMentionAllAppUsersQuery,
      },
    ) => {
      try {
        if (!query) return [];
        if (options?.mentionAllAppUsersEnabled) {
          return (queryUsersDebounced as DebouncedFunc<QueryUsersFunction<StreamChatGenerics>>)(
            client,
            query,
            (data) => {
              if (onReady) {
                onReady(data, query);
              }
            },
            {
              limit: options.limit,
              mentionAllAppUsersQuery: options.mentionAllAppUsersQuery,
            },
          );
        }
        /**
         * By default, we return maximum 100 members via queryChannels api call.
         * Thus it is safe to assume, that if number of members in channel.state is < 100,
         * then all the members are already available on client side and we don't need to
         * make any api call to queryMembers endpoint.
         */
        if (Object.values(channel.state.members).length < 100) {
          const users = getMembersAndWatchers(channel);

          const matchingUsers = users.filter((user) => {
            if (!query) return true;
            // Don't show current authenticated user in the list
            if (user.id === client.userID) {
              return false;
            }
            if (user.name?.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
              return true;
            }
            if (user.id.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
              return true;
            }
            return false;
          });

          const data = matchingUsers.slice(0, options?.limit);

          if (onReady) {
            onReady(data, query);
          }

          return data;
        }

        return (queryMembersDebounced as DebouncedFunc<QueryMembersFunction<StreamChatGenerics>>)(
          client,
          channel,
          query,
          (data) => {
            if (onReady) {
              onReady(data, query);
            }
          },
          {
            limit: options.limit,
          },
        );
      } catch (error) {
        console.warn("Error querying users/members while using '@':", error);
        throw error;
      }
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `@${entity.name || entity.id}`,
    }),
    type: 'mention',
  },
});
