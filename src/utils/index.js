import { MentionsItem } from '../components/MentionsItem';
import { CommandsItem } from '../components/CommandsItem';

export { renderText } from './renderText';
export { renderReactions } from './renderReactions';

export { Streami18n } from './Streami18n';
export const emojiData = [
  {
    id: 'like',
    icon: '👍',
  },
  {
    id: 'love',
    icon: '❤️️',
  },
  {
    id: 'haha',
    icon: '😂',
  },
  {
    id: 'wow',
    icon: '😮',
  },
  {
    id: 'sad',
    icon: '😔',
  },
  {
    id: 'angry',
    icon: '😠',
  },
];

export const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const FileState = Object.freeze({
  NO_FILE: 'no_file',
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  UPLOAD_FAILED: 'upload_failed',
});

export const ProgressIndicatorTypes = Object.freeze({
  IN_PROGRESS: 'in_progress',
  RETRY: 'retry',
});

// ACI = AutoCompleteInput
export const ACITriggerSettings = ({
  users,
  onMentionSelectItem,
  commands,
  t = (msg) => msg,
}) => ({
  '@': {
    dataProvider: (q) => {
      const matchingUsers = users.filter((user) => {
        if (!q) return true;
        if (
          user.name !== undefined &&
          user.name.toLowerCase().indexOf(q.toLowerCase()) !== -1
        ) {
          return true;
        } else if (user.id.toLowerCase().indexOf(q.toLowerCase()) !== -1) {
          return true;
        } else {
          return false;
        }
      });
      return matchingUsers.slice(0, 10);
    },
    component: MentionsItem,
    title: t('Searching for people'),
    output: (entity) => ({
      key: entity.id,
      text: `@${entity.name || entity.id}`,
      caretPosition: 'next',
    }),
    callback: (item) => {
      onMentionSelectItem(item);
    },
  },
  '/': {
    dataProvider: (q, text) => {
      if (text.indexOf('/') !== 0) {
        return [];
      }

      const selectedCommands = commands.filter((c) => c.name.indexOf(q) !== -1);

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

      return selectedCommands.slice(0, 10);
    },
    title: t('Commands'),
    component: CommandsItem,
    output: (entity) => ({
      key: entity.id,
      text: `/${entity.name}`,
      caretPosition: 'next',
    }),
  },
});

export const MESSAGE_ACTIONS = {
  edit: 'edit',
  delete: 'delete',
  reactions: 'reactions',
  reply: 'reply',
};

export const makeImageCompatibleUrl = (url) => {
  if (!url) return url;

  let newUrl = url;
  if (url.indexOf('//') === 0) newUrl = 'https:' + url;

  return newUrl;
};
