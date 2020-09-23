import debounce from 'lodash/debounce';

import type {
  Channel,
  ChannelMemberAPIResponse,
  ChannelMemberResponse,
  UnknownType,
  UserResponse,
} from 'stream-chat';

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
  NO_FILE: 'no_file',
  UPLOAD_FAILED: 'upload_failed',
  UPLOADED: 'uploaded',
  UPLOADING: 'uploading',
});

export const ProgressIndicatorTypes = Object.freeze({
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
    ? Object.values(members)
        .filter((member) => member.user)
        .map((member) => member.user)
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
  const users = [
    ...getMembers<At, Ch, Co, Ev, Me, Re, Us>(channel),
    ...getWatchers<At, Ch, Co, Ev, Me, Re, Us>(channel),
  ];

  // make sure we don't list users twice
  const uniqueUsers: {
    [key: string]: SuggestionUser<Us>;
  } = {};
  for (const user of users) {
    if (user !== undefined && !uniqueUsers[user.id]) {
      uniqueUsers[user.id] = user;
    }
  }
  const usersArray = Object.values(uniqueUsers);

  return usersArray;
};

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
  onReady: (users: SuggestionUser<Us>[]) => void,
): Promise<void> => {
  await debounce(
    async () => {
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
    },
    200,
    { leading: false, trailing: true },
  );
};

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
      onReady: (
        data: SuggestionCommand<Co>[],
        query: SuggestionCommand<Co>['name'],
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
      onReady: (
        data: SuggestionUser<Us>[],
        query: SuggestionUser<Us>['name'],
      ) => void,
    ) => SuggestionUser<Us>[] | Promise<void>;
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

// ACI = AutoCompleteInput
//
// dataProvider accepts `onReady` function, which will executed once the data is ready.
// Another approach would have been to simply return the data from dataProvider and let the
// component await for it and then execute the required logic. We are going for callback instead
// of async-await since we have debounce function in dataProvider. Which will delay the execution
// of api call on trailing end of debounce (lets call it a1) but will return with result of
// previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
// end of debounce executes.
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
  t = (msg) => msg,
}: {
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  onMentionSelectItem: (item: SuggestionUser<Us>) => void;
} & Pick<TranslationContextValue, 't'>): TriggerSettings<Co, Us> => ({
  '/': {
    component: 'CommandsItem',
    dataProvider: (query, text, onReady) => {
      if (text.indexOf('/') !== 0) {
        return [];
      }

      const selectedCommands = getCommands<At, Ch, Co, Ev, Me, Re, Us>(
        channel,
      ).filter((command) => query && command?.name?.indexOf(query) !== -1);

      // sort alphabetically unless the you're matching the first char
      selectedCommands.sort((a, b) => {
        let nameA = a?.name?.toLowerCase() || '';
        let nameB = b?.name?.toLowerCase() || '';
        if (query && nameA.indexOf(query) === 0) {
          nameA = `0${nameA}`;
        }
        if (query && nameB.indexOf(query) === 0) {
          nameB = `0${nameB}`;
        }
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }

        return 0;
      });

      const result = selectedCommands.slice(0, 10);

      onReady(result, query);

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
      // By default, we return maximum 100 members via queryChannels api call.
      // Thus it is safe to assume, that if number of members in channel.state is < 100,
      // then all the members are already available on client side and we don't need to
      // make any api call to queryMembers endpoint.
      if (!query || Object.values(members).length < 100) {
        const users = getMembersAndWatchers<At, Ch, Co, Ev, Me, Re, Us>(
          channel,
        );

        const matchingUsers = users.filter((user) => {
          if (!query) return true;
          if (
            user.name !== undefined &&
            user.name.toLowerCase().indexOf(query.toLowerCase()) !== -1
          ) {
            return true;
          } else if (
            user.id.toLowerCase().indexOf(query.toLowerCase()) !== -1
          ) {
            return true;
          } else {
            return false;
          }
        });

        const data = matchingUsers.slice(0, 10);

        onReady(data, query);

        return data;
      }

      return queryMembers<At, Ch, Co, Ev, Me, Re, Us>(
        channel,
        query,
        (data) => {
          onReady(data, query);
        },
      );
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

export const makeImageCompatibleUrl = (url: string) => {
  let newUrl = url;
  if (url.indexOf('//') === 0) newUrl = `https:${url}`;

  return newUrl.trim();
};
