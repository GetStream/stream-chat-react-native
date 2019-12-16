import anchorme from 'anchorme';
import React from 'react';
import { truncate } from 'lodash-es';
import { MentionsItem } from './components/MentionsItem';
import { CommandsItem } from './components/CommandsItem';

import Markdown from '@stream-io/react-native-simple-markdown';

export const renderText = (message, styles) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  let { text } = message;
  const { mentioned_users = [] } = message;

  if (!text) {
    return;
  }
  text = text.trim();
  const urls = anchorme(text, {
    list: true,
  });
  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 20,
      omission: '...',
    });
    const mkdown = `[${displayLink}](${urlInfo.protocol}${urlInfo.encoded})`;
    text = text.replace(urlInfo.raw, mkdown);
  }
  let newText = text;
  if (mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      const username = mentioned_users[i].name || mentioned_users[i].id;
      const mkdown = `**@${username}**`;
      const re = new RegExp(`@${username}`, 'g');
      newText = newText.replace(re, mkdown);
    }
  }

  newText = newText.replace(/[<&"'>]/g, '\\$&');
  const markdownStyles = {
    ...defaultMarkdownStyles,
    ...styles,
  };

  return <Markdown styles={markdownStyles}>{newText}</Markdown>;
};

const defaultMarkdownStyles = {
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  url: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
};

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
    title: 'Searching for people',
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
    title: 'Commands',
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
