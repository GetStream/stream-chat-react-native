import type React from 'react';

import EmojiRegex from 'emoji-regex';
import type { DebouncedFunc } from 'lodash';
import debounce from 'lodash/debounce';
import type {
  Channel,
  ChannelMemberAPIResponse,
  ChannelMemberResponse,
  CommandResponse,
  FormatMessageResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import type { MessageType } from '../components/MessageList/hooks/useMessageList';
import type {
  EmojiSearchIndex,
  MentionAllAppUsersQuery,
} from '../contexts/messageInputContext/MessageInputContext';
import type {
  SuggestionCommand,
  SuggestionComponentType,
  SuggestionUser,
} from '../contexts/suggestionsContext/SuggestionsContext';
import { compiledEmojis, Emoji } from '../emoji-data';
import type { IconProps } from '../icons/utils/base';
import type { TableRowJoinedUser } from '../store/types';
import type { DefaultStreamChatGenerics, ValueOf } from '../types/types';

export type ReactionData = {
  Icon: React.FC<IconProps>;
  type: string;
};

export const FileState = Object.freeze({
  // finished and uploaded state are the same thing. First is set on frontend,
  // while later is set on backend side
  // TODO: Unify both of them
  FINISHED: 'finished',
  NOT_SUPPORTED: 'not_supported',
  UPLOAD_FAILED: 'upload_failed',
  UPLOADED: 'uploaded',
  UPLOADING: 'uploading',
});

export const ProgressIndicatorTypes: {
  IN_PROGRESS: 'in_progress';
  INACTIVE: 'inactive';
  NOT_SUPPORTED: 'not_supported';
  RETRY: 'retry';
} = Object.freeze({
  IN_PROGRESS: 'in_progress',
  INACTIVE: 'inactive',
  NOT_SUPPORTED: 'not_supported',
  RETRY: 'retry',
});

export const MessageStatusTypes = {
  FAILED: 'failed',
  RECEIVED: 'received',
  SENDING: 'sending',
};

export type FileStateValue = typeof FileState[keyof typeof FileState];

type Progress = ValueOf<typeof ProgressIndicatorTypes>;
type IndicatorStatesMap = Record<ValueOf<typeof FileState>, Progress | null>;

export const getIndicatorTypeForFileState = (
  fileState: FileStateValue,
  enableOfflineSupport: boolean,
): Progress | null => {
  const indicatorMap: IndicatorStatesMap = {
    [FileState.UPLOADING]: enableOfflineSupport
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.IN_PROGRESS,
    // If offline support is disabled, then there is no need
    [FileState.UPLOAD_FAILED]: enableOfflineSupport
      ? ProgressIndicatorTypes.INACTIVE
      : ProgressIndicatorTypes.RETRY,
    [FileState.NOT_SUPPORTED]: ProgressIndicatorTypes.NOT_SUPPORTED,
    [FileState.UPLOADED]: ProgressIndicatorTypes.INACTIVE,
    [FileState.FINISHED]: ProgressIndicatorTypes.INACTIVE,
  };

  return indicatorMap[fileState];
};

/**
 * Utility to check if the message is a Blocked message.
 * @param message
 * @returns boolean
 */
export const isBlockedMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatGenerics> | TableRowJoinedUser<'messages'>,
) => {
  // The only indicator for the blocked message is its message type is error and that the message text contains "Message was blocked by moderation policies".
  const pattern = /\bMessage was blocked by moderation policies\b/;
  return message.type === 'error' && message.text && pattern.test(message.text);
};

/**
 *  Utility to check if the message is a Bounced message.
 * @param message
 * @returns boolean
 */
export const isBouncedMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message: MessageType<StreamChatGenerics>,
) => message.type === 'error' && message.moderation_details !== undefined;

const defaultAutoCompleteSuggestionsLimit = 10;
const defaultMentionAllAppUsersQuery = {
  filters: {},
  options: {},
  sort: {},
};

const isUserResponse = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  user: SuggestionUser<StreamChatGenerics> | undefined,
): user is SuggestionUser<StreamChatGenerics> =>
  (user as SuggestionUser<StreamChatGenerics>) !== undefined;

const getCommands = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => channel.getConfig()?.commands || [];

const getMembers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const members = channel.state.members;

  return Object.values(members).length
    ? (
        Object.values(members).filter((member) => member.user) as Array<
          ChannelMemberResponse<StreamChatGenerics> & { user: UserResponse<StreamChatGenerics> }
        >
      ).map((member) => member.user)
    : [];
};

const getWatchers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const watchers = channel.state.watchers;
  return Object.values(watchers).length ? [...Object.values(watchers)] : [];
};

const getMembersAndWatchers = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
) => {
  const users = [...getMembers(channel), ...getWatchers(channel)];

  return Object.values(
    users.reduce((acc, cur) => {
      if (!acc[cur.id]) {
        acc[cur.id] = cur;
      }

      return acc;
    }, {} as { [key: string]: SuggestionUser<StreamChatGenerics> }),
  );
};

const queryMembers = async <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  channel: Channel<StreamChatGenerics>,
  query: SuggestionUser<StreamChatGenerics>['name'],
  onReady?: (users: SuggestionUser<StreamChatGenerics>[]) => void,
  options: {
    limit?: number;
  } = {},
): Promise<void> => {
  const { limit = defaultAutoCompleteSuggestionsLimit } = options;

  if (typeof query === 'string') {
    const response = (await (channel as unknown as Channel).queryMembers(
      {
        name: { $autocomplete: query },
      },
      {},
      { limit },
    )) as ChannelMemberAPIResponse<StreamChatGenerics>;

    const users: SuggestionUser<StreamChatGenerics>[] = [];
    response.members.forEach((member) => isUserResponse(member.user) && users.push(member.user));
    if (onReady && users) {
      onReady(users);
    }
  }
};

export const queryMembersDebounced = debounce(queryMembers, 200, {
  leading: false,
  trailing: true,
});

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
  if (typeof query === 'string') {
    const {
      limit = defaultAutoCompleteSuggestionsLimit,
      mentionAllAppUsersQuery = defaultMentionAllAppUsersQuery,
    } = options;
    const filters = {
      id: { $ne: client.userID },
      ...mentionAllAppUsersQuery?.filters,
    };

    if (query) {
      // @ts-ignore
      filters.$or = [{ id: { $autocomplete: query } }, { name: { $autocomplete: query } }];
    }

    const response = await client.queryUsers(
      // @ts-ignore
      filters,
      { id: 1, ...mentionAllAppUsersQuery?.sort },
      { limit, ...mentionAllAppUsersQuery?.options },
    );
    const users: SuggestionUser<StreamChatGenerics>[] = [];
    response.users.forEach((user) => isUserResponse(user) && users.push(user));
    if (onReady && users) {
      onReady(users);
    }
  }
};

export const queryUsersDebounced = debounce(queryUsers, 200, {
  leading: false,
  trailing: true,
});

export const isCommandTrigger = (trigger: Trigger): trigger is '/' => trigger === '/';

export const isEmojiTrigger = (trigger: Trigger): trigger is ':' => trigger === ':';

export const isMentionTrigger = (trigger: Trigger): trigger is '@' => trigger === '@';

export type Trigger = '/' | '@' | ':';

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
    output: (entity: CommandResponse<StreamChatGenerics>) => {
      caretPosition: string;
      key: string;
      text: string;
    };
    type: SuggestionComponentType;
  };
  ':'?: {
    dataProvider: (
      query: Emoji['name'],
      _: string,
      onReady?: (data: Emoji[], q: Emoji['name']) => void,
    ) => Emoji[] | Promise<Emoji[]>;
    output: (entity: Emoji) => {
      caretPosition: string;
      key: string;
      text: string;
    };
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
    output: (entity: SuggestionUser<StreamChatGenerics>) => {
      caretPosition: string;
      key: string;
      text: string;
    };
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

export type QueryMembersFunction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = (
  channel: Channel<StreamChatGenerics>,
  query: SuggestionUser<StreamChatGenerics>['name'],
  onReady?: (users: SuggestionUser<StreamChatGenerics>[]) => void,
  options?: {
    limit?: number;
  },
) => Promise<void>;

/**
 * Default emoji search index for auto complete text input
 */
export const defaultEmojiSearchIndex: EmojiSearchIndex = {
  search: (query) => {
    const results = [];

    for (const emoji of compiledEmojis) {
      if (results.length >= 10) return results;
      if (emoji.names.some((name) => name.includes(query))) {
        // Aggregate skins as different toned emojis - if skins are present
        if (emoji.skins) {
          results.push({
            ...emoji,
            name: `${emoji.name}-tone-1`,
            skins: undefined,
          });
          emoji.skins.forEach((tone, index) =>
            results.push({
              ...emoji,
              name: `${emoji.name}-tone-${index + 2}`,
              skins: undefined,
              unicode: tone,
            }),
          );
        } else {
          results.push(emoji);
        }
      }
    }

    return results;
  },
};

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
      if (!query) return [];

      const emojis = (await emojiSearchIndex?.search(query)) ?? [];

      if (onReady) {
        onReady(emojis, query);
      }

      return emojis;
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
      if (!query || Object.values(channel.state.members).length < 100) {
        const users = getMembersAndWatchers(channel);

        const matchingUsers = users.filter((user) => {
          if (!query) return true;
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
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `@${entity.name || entity.id}`,
    }),
    type: 'mention',
  },
});

export const makeImageCompatibleUrl = (url: string) =>
  (url.indexOf('//') === 0 ? `https:${url}` : url).trim();

export const getUrlWithoutParams = (url?: string) => {
  if (!url) return url;

  const indexOfQuestion = url.indexOf('?');
  if (indexOfQuestion === -1) return url;

  return url.substring(0, url.indexOf('?'));
};

export const isLocalUrl = (url: string) => url.indexOf('http') !== 0;

export const generateRandomId = (a = ''): string =>
  a
    ? /* eslint-disable no-bitwise */
      ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
    : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, generateRandomId);

/*
 * Returns true if the message text only contains emojis
 */
export const hasOnlyEmojis = (text: string) => {
  try {
    // get all emojis in the string
    const emojiOnlyString = [...text.matchAll(EmojiRegex())].join('');
    // remove all spaces from original text
    const originalTextWithNoSpaces = text.replaceAll(/\s/g, '');
    // check if both are the same
    return (
      emojiOnlyString.length !== 0 && emojiOnlyString.length === originalTextWithNoSpaces.length
    );
  } catch (e) {
    return false;
  }
};

/**
 * Stringifies a message object
 * @param {FormatMessageResponse<StreamChatGenerics>} message - the message object to be stringified
 * @returns {string} The stringified message
 */
const stringifyMessage = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  deleted_at,
  latest_reactions,
  reply_count,
  status,
  type,
  updated_at,
}: FormatMessageResponse<StreamChatGenerics>): string =>
  `${type}${deleted_at}${
    latest_reactions ? latest_reactions.map(({ type }) => type).join() : ''
  }${reply_count}${status}${updated_at?.toISOString?.() || updated_at}`;

/**
 * Reduces a list of messages to strings that are used in useEffect & useMemo
 * @param {messages} messages - the array of messages to be compared
 * @returns {string} The mapped message string
 */
export const reduceMessagesToString = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  messages: FormatMessageResponse<StreamChatGenerics>[],
): string => messages.map(stringifyMessage).join();
