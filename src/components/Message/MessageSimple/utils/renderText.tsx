import React from 'react';
// @ts-expect-error
import Markdown from '@stream-io/react-native-simple-markdown';
import anchorme from 'anchorme';
import truncate from 'lodash/truncate';

import type { MarkdownStyle } from '../../../../styles/themeConstants';
import type { Message } from '../../../MessageList/utils/insertDates';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

type Parameters<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
> = {
  markdownRules: Record<string, unknown>;
  markdownStyles: MarkdownStyle;
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
};

export const renderText = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
>({
  markdownRules,
  markdownStyles,
  message,
}: Parameters<At, Ch, Co, Ev, Me, Re, Us>) => {
  // take the @ mentions and turn them into markdown?
  // translate links
  const { mentioned_users = [], text } = message;

  if (!text) {
    return null;
  }

  let newText = text.trim();
  const urls = anchorme(newText, {
    list: true,
  });

  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 20,
      omission: '...',
    });
    const mkdown = `[${displayLink}](${urlInfo.protocol}${urlInfo.encoded})`;
    newText = newText.replace(urlInfo.raw, mkdown);
  }

  if (mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      const username = mentioned_users[i].name || mentioned_users[i].id;
      const mkdown = `**@${username}**`;
      const re = new RegExp(`@${username}`, 'g');
      newText = newText.replace(re, mkdown);
    }
  }

  newText = newText.replace(/[<&"'>]/g, '\\$&');
  const styles = {
    ...defaultMarkdownStyles,
    ...markdownStyles,
  };

  return (
    <Markdown rules={markdownRules} styles={styles}>
      {newText}
    </Markdown>
  );
};

const defaultMarkdownStyles = {
  inlineCode: {
    backgroundColor: '#F3F3F3',
    borderColor: '#dddddd',
    color: 'red',
    fontSize: 13,
    padding: 3,
    paddingHorizontal: 5,
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  url: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
};
