import React from 'react';
import { Linking, Text } from 'react-native';
import anchorme from 'anchorme';
import truncate from 'lodash/truncate';
// @ts-expect-error
import Markdown from 'react-native-markdown-package';
import {
  DefaultRules,
  defaultRules,
  MatchFunction,
  ParseFunction,
  parseInline,
  ReactNodeOutput,
} from 'simple-markdown';

import type { Message } from '../../../MessageList/hooks/useMessageList';
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

import type { MessageContextValue } from '../../../../contexts/messageContext/MessageContext';
import type { MarkdownStyle } from '../../../../contexts/themeContext/utils/theme';

const defaultMarkdownStyles: MarkdownStyle = {
  inlineCode: {
    backgroundColor: '#F3F3F3',
    borderColor: '#dddddd',
    color: 'red',
    fontSize: 13,
    padding: 3,
    paddingHorizontal: 5,
  },
  paragraph: {
    marginBottom: 8,
    marginTop: 8,
  },
  paragraphCenter: {
    marginBottom: 8,
    marginTop: 8,
  },
  paragraphWithImage: {
    marginBottom: 8,
    marginTop: 8,
  },
};

export type MarkdownRules = Partial<DefaultRules>;

export type RenderTextParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onLongPress'>
> & {
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
  markdownRules?: MarkdownRules;
  markdownStyles?: MarkdownStyle;
  onLink?: (url: string) => Promise<void>;
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
  const {
    markdownRules,
    markdownStyles,
    message,
    onLink: onLinkParams,
    onLongPress,
  } = params;

  // take the @ mentions and turn them into markdown?
  // translate links
  const { text } = message;

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

  newText = newText.replace(/[<&"'>]/g, '\\$&');
  const styles = {
    ...defaultMarkdownStyles,
    ...markdownStyles,
  };

  const onLink = (url: string) =>
    onLinkParams
      ? onLinkParams(url)
      : Linking.canOpenURL(url).then(
          (canOpenUrl) => canOpenUrl && Linking.openURL(url),
        );

  const react: ReactNodeOutput = (node, output, { ...state }) => {
    state.withinLink = true;
    const link = React.createElement(
      Text,
      {
        key: state.key,
        onLongPress,
        onPress: () => onLink(node.target),
        style: styles.autolink,
        suppressHighlighting: true,
      },
      output(node.content, state),
    );
    state.withinLink = false;
    return link;
  };

  const regEx = new RegExp('^\\B@\\w+', 'g');
  const match: MatchFunction = (source) => regEx.exec(source);
  const mentionsReact: ReactNodeOutput = (node, output, { ...state }) =>
    React.createElement(
      Text,
      {
        key: state.key,
        style: styles.mentions,
      },
      Array.isArray(node.content)
        ? node.content[0]?.content || ''
        : output(node.content, state),
    );
  const parse: ParseFunction = (capture, parse, state) => ({
    content: parseInline(parse, capture[0], state),
  });

  return (
    <Markdown
      onLink={onLink}
      rules={{
        link: { react },
        mentions: {
          match,
          order: defaultRules.text.order - 0.5,
          parse,
          react: mentionsReact,
        },
        ...markdownRules,
      }}
      styles={styles}
    >
      {newText}
    </Markdown>
  );
};
