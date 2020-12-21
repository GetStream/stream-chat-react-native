import debounce from 'lodash/debounce';

import type {
  Channel,
  ChannelMemberAPIResponse,
  ChannelMemberResponse,
  UserResponse,
} from 'stream-chat';
import type { DebouncedFunc } from 'lodash';
import type { CommandsItemProps } from '../components/AutoCompleteInput/CommandsItem';
import type { MentionsItemProps } from '../components/AutoCompleteInput/MentionsItem';
import type {
  SuggestionCommand,
  SuggestionUser,
} from '../contexts/suggestionsContext/SuggestionsContext';
import type { TranslationContextValue } from '../contexts/translationContext/TranslationContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../types/types';

export const emojiData = [
  {
    icon: '👍',
    id: 'like',
  },
  {
    icon: '❤️️',
    id: 'love',
  },
  {
    icon: '😂',
    id: 'haha',
  },
  {
    icon: '😮',
    id: 'wow',
  },
  {
    icon: '😔',
    id: 'sad',
  },
  {
    icon: '😠',
    id: 'angry',
  },
];

export const FileState = Object.freeze({
  // finished and uploaded state are the same thing. First is set on frontend,
  // while later is set on backend side
  // TODO: Unify both of them
  FINISHED: 'finished',
  NO_FILE: 'no_file',
  UPLOAD_FAILED: 'upload_failed',
  UPLOADED: 'uploaded',
  UPLOADING: 'uploading',
});

export const ProgressIndicatorTypes: {
  IN_PROGRESS: 'in_progress';
  RETRY: 'retry';
} = Object.freeze({
  IN_PROGRESS: 'in_progress',
  RETRY: 'retry',
});

const isUserResponse = <Us extends DefaultUserType = DefaultUserType>(
  user: SuggestionUser<Us> | undefined,
): user is SuggestionUser<Us> => (user as SuggestionUser<Us>) !== undefined;

const getCommands = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
) => channel.getConfig()?.commands || [];

const getMembers = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const members = (channel.state.members as unknown) as ChannelMemberResponse<
    Us
  >[];
  return members && Object.values(members).length
    ? (Object.values(members).filter((member) => member.user) as Array<
        ChannelMemberResponse<Us> & { user: UserResponse<Us> }
      >).map((member) => member.user)
    : [];
};

const getWatchers = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const watchers = (channel.state.watchers as unknown) as UserResponse<Us>[];
  return watchers && Object.values(watchers).length
    ? [...Object.values(watchers)]
    : [];
};

const getMembersAndWatchers = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const users = [...getMembers(channel), ...getWatchers(channel)];

  return Object.values(
    users.reduce((acc, cur) => {
      if (!acc[cur.id]) {
        acc[cur.id] = cur;
      }

      return acc;
    }, {} as { [key: string]: SuggestionUser<Us> }),
  );
};
type QueryMembersFunction<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = (
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  query: SuggestionUser<Us>['name'],
  onReady?: (users: SuggestionUser<Us>[]) => void,
) => Promise<void>;

// TODO: test to see if this function works as it integrated a debounce function
const queryMembers = async <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
  query: SuggestionUser<Us>['name'],
  onReady?: (users: SuggestionUser<Us>[]) => void,
): Promise<void> => {
  if (typeof query === 'string') {
    const response = (await ((channel as unknown) as Channel).queryMembers({
      name: { $autocomplete: query },
    })) as ChannelMemberAPIResponse<Us>;

    const users: SuggestionUser<Us>[] = [];
    response.members.forEach(
      (member) => isUserResponse(member.user) && users.push(member.user),
    );
    if (onReady && users) {
      onReady(users);
    }
  }
};
export const queryMembersDebounced = debounce(queryMembers, 200, {
  leading: false,
  trailing: true,
});
export const isMentionTrigger = (trigger: Trigger): trigger is '@' =>
  trigger === '@';

export type Trigger = '/' | '@';

export type TriggerSettings<
  Co extends string = DefaultCommandType,
  Us extends UnknownType = DefaultUserType
> = {
  '/': {
    component: string | React.ComponentType<Partial<CommandsItemProps<Co>>>;
    dataProvider: (
      query: SuggestionCommand<Co>['name'],
      text: string,
      onReady?: (
        data: SuggestionCommand<Co>[],
        q: SuggestionCommand<Co>['name'],
      ) => void,
    ) => SuggestionCommand<Co>[];
    output: (
      entity: SuggestionCommand<Co>,
    ) => {
      caretPosition: string;
      key: string;
      text: string;
    };
    title: string;
  };
  '@': {
    callback: (item: SuggestionUser<Us>) => void;
    component: string | React.ComponentType<Partial<MentionsItemProps<Us>>>;
    dataProvider: (
      query: SuggestionUser<Us>['name'],
      _: string,
      onReady?: (
        data: SuggestionUser<Us>[],
        q: SuggestionUser<Us>['name'],
      ) => void,
    ) => SuggestionUser<Us>[] | Promise<void> | void;
    output: (
      entity: SuggestionUser<Us>,
    ) => {
      caretPosition: string;
      key: string;
      text: string;
    };
    title: string;
  };
};

export type ACITriggerSettingsParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  onMentionSelectItem: (item: SuggestionUser<Us>) => void;
  autocompleteSuggestionsLimit?: number;
} & Pick<TranslationContextValue, 't'>;

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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  channel,
  onMentionSelectItem,
  t = (msg: string) => msg,
  autocompleteSuggestionsLimit = 10,
}: ACITriggerSettingsParams<At, Ch, Co, Ev, Me, Re, Us>): TriggerSettings<
  Co,
  Us
> => ({
  '/': {
    component: 'CommandsItem',
    dataProvider: (query, text, onReady) => {
      if (text.indexOf('/') !== 0) return [];

      const selectedCommands = getCommands(channel).filter(
        (command) => query && command.name?.indexOf(query) !== -1,
      );

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

      const result = selectedCommands.slice(0, autocompleteSuggestionsLimit);

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
    title: t('Commands'),
  },
  '@': {
    callback: (item) => {
      onMentionSelectItem(item);
    },
    component: 'MentionsItem',
    dataProvider: (query, _, onReady) => {
      const members = channel.state.members;

      /**
       * By default, we return maximum 100 members via queryChannels api call.
       * Thus it is safe to assume, that if number of members in channel.state is < 100,
       * then all the members are already available on client side and we don't need to
       * make any api call to queryMembers endpoint.
       */
      if (!query || Object.values(members).length < 100) {
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

        const data = matchingUsers.slice(0, autocompleteSuggestionsLimit);

        if (onReady) {
          onReady(data, query);
        }

        return data;
      }
      return (queryMembersDebounced as DebouncedFunc<
        QueryMembersFunction<At, Ch, Co, Ev, Me, Re, Us>
      >)(channel, query, (data) => {
        if (onReady) {
          onReady(data, query);
        }
      });
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `@${entity.name || entity.id}`,
    }),
    title: t('Searching for people'),
  },
});

export const MESSAGE_ACTIONS = {
  delete: 'delete',
  edit: 'edit',
  reactions: 'reactions',
  reply: 'reply',
};

export const makeImageCompatibleUrl = (url: string) =>
  (url.indexOf('//') === 0 ? `https:${url}` : url).trim();
