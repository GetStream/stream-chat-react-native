import debounce from 'lodash/debounce';

export { renderReactions } from './renderReactions';

export { Streami18n } from './Streami18n';
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

const getCommands = (channel) => {
  const config = channel.getConfig();

  if (!config) return [];

  const allCommands = config.commands;
  return allCommands;
};

const getMembers = (channel) => {
  const result = [];
  const members = channel.state.members;
  if (members && Object.values(members).length) {
    Object.values(members).forEach((member) => result.push(member.user));
  }

  return result;
};

const getWatchers = (channel) => {
  const result = [];
  const watchers = channel.state.watchers;
  if (watchers && Object.values(watchers).length) {
    result.push(...Object.values(watchers));
  }

  return result;
};

const getMembersAndWatchers = (channel) => {
  const users = [...getMembers(channel), ...getWatchers(channel)];

  // make sure we don't list users twice
  const uniqueUsers = {};
  for (const user of users) {
    if (user !== undefined && !uniqueUsers[user.id]) {
      uniqueUsers[user.id] = user;
    }
  }
  const usersArray = Object.values(uniqueUsers);

  return usersArray;
};

const queryMembers = async (channel, query, onReady) => {
  const response = await channel.queryMembers({
    name: { $autocomplete: query },
  });

  const users = response.members.map((m) => m.user);
  onReady && onReady(users);
};

const queryMembersDebounced = debounce(queryMembers, 200, {
  leading: false,
  trailing: true,
});

// ACI = AutoCompleteInput
//
// dataProvider accepts `onReady` function, which will executed once the data is ready.
// Another approach would have been to simply return the data from dataProvider and let the
// component await for it and then execute the required logic. We are going for callback instead
// of async-await since we have debounce function in dataProvider. Which will delay the execution
// of api call on trailing end of debounce (lets call it a1) but will return with result of
// previous call without waiting for a1. So in this case, we want to execute onReady, when trailing
// end of debounce executes.
export const ACITriggerSettings = ({
  channel,
  onMentionSelectItem,
  t = (msg) => msg,
}) => ({
  '/': {
    component: 'CommandsItem',
    dataProvider: (q, text, onReady) => {
      if (text.indexOf('/') !== 0) {
        return [];
      }

      const selectedCommands = getCommands(channel).filter(
        (c) => c.name.indexOf(q) !== -1,
      );

      // sort alphabetically unless the you're matching the first char
      selectedCommands.sort((a, b) => {
        let nameA = a.name.toLowerCase();
        let nameB = b.name.toLowerCase();
        if (nameA.indexOf(q) === 0) {
          nameA = `0${nameA}`;
        }
        if (nameB.indexOf(q) === 0) {
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

      onReady && onReady(result, q);

      return result;
    },
    output: (entity) => ({
      caretPosition: 'next',
      key: entity.id,
      text: `/${entity.name}`,
    }),
    title: t('Commands'),
  },
  '@': {
    callback: (item) => {
      onMentionSelectItem(item);
    },
    component: 'MentionsItem',
    dataProvider: (query, text, onReady) => {
      const members = channel.state.members;
      // By default, we return maximum 100 members via queryChannels api call.
      // Thus it is safe to assume, that if number of members in channel.state is < 100,
      // then all the members are already available on client side and we don't need to
      // make any api call to queryMembers endpoint.
      if (!query || Object.values(members).length < 100) {
        const users = getMembersAndWatchers(channel);

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

        onReady && onReady(data, query);

        return data;
      }

      return queryMembersDebounced(channel, query, (data) => {
        onReady(data, query);
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

export const makeImageCompatibleUrl = (url) => {
  if (!url) return url;

  let newUrl = url;
  if (url.indexOf('//') === 0) newUrl = 'https:' + url;

  return newUrl.trim();
};
