import anchorme from 'anchorme';
import React from 'react';
import { truncate } from 'lodash-es';
import { Text, View, Avatar } from 'react-native';
import Markdown from 'react-native-simple-markdown';

export const renderText = (message) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  let { text } = message;
  const { mentioned_users } = message;

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

  return <Markdown styles={markdownStyles}>{newText}</Markdown>;
};

const markdownStyles = {
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
    id: 'haha',
    icon: '😀',
  },
  {
    id: 'love',
    icon: '😍',
  },
  {
    id: 'sad',
    icon: '😥',
  },
  {
    id: 'wow',
    icon: '😳',
  },
  {
    id: 'like',
    icon: '👍',
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
export const ACITriggerSettings = (onMentionSelectItem) => ({
  '@': {
    dataProvider: (q, users) => {
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
    component: SuggestionsMentionItem,
    output: (entity) => ({
      key: entity.id,
      text: `@${entity.name || entity.id}`,
      caretPosition: 'next',
    }),
    callback: (item) => {
      onMentionSelectItem(item);
    },
  },
});

export const SuggestionsMentionItem = ({ name, icon }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Avatar image={icon} />
    <Text style={{ padding: 10 }}>{name}</Text>
  </View>
);

export const MESSAGE_ACTIONS = {
  edit: 'edit',
  delete: 'delete',
  reactions: 'reactions',
  reply: 'reply',
};
