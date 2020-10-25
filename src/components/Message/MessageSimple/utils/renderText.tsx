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
  UnknownType,
} from '../../../../types/types';

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

export type RenderTextParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  markdownRules: UnknownType;
  markdownStyles: MarkdownStyle;
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
};

export const renderText = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  params: RenderTextParams<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { markdownRules, markdownStyles, message } = params;

  // take the @ mentions and turn them into markdown?
  // translate links
  const { mentioned_users = [], text } = message;

  if (!text) return null;

  let newText = text.trim();
  const urls = anchorme(newText, {
    list: true,
  });

  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded.replace(/^(www\.)/, ''), {
      length: 200,
      omission: '...',
    });
    const markdown = `[${displayLink}](${urlInfo.protocol}${urlInfo.encoded})`;
    newText = newText.replace(urlInfo.raw, markdown);
  }

  if (mentioned_users.length) {
    for (let i = 0; i < mentioned_users.length; i++) {
      const username = mentioned_users[i].name || mentioned_users[i].id;
      const markdown = `**@${username}**`;
      const regEx = new RegExp(`@${username}`, 'g');
      newText = newText.replace(regEx, markdown);
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
