import React from 'react';
import { GestureResponderEvent, Linking, Text } from 'react-native';
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

import type { MessageType } from '../../../MessageList/hooks/useMessageList';

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
import type { Colors, MarkdownStyle } from '../../../../contexts/themeContext/utils/theme';

const defaultMarkdownStyles: MarkdownStyle = {
  inlineCode: {
    fontSize: 13,
    padding: 3,
    paddingHorizontal: 5,
  },
  list: {
    marginBottom: 8,
    marginTop: 8,
  },
  listItemText: {
    flex: 0,
  },
  mentions: {
    fontWeight: '700',
  },
  // unfortunately marginVertical doesn't override the defaults for these within the 3rd party lib
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

const parse: ParseFunction = (capture, parse, state) => ({
  content: parseInline(parse, capture[0], state),
});

export type MarkdownRules = Partial<DefaultRules>;

export type RenderTextParams<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<
  Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'onLongPress' | 'onPress' | 'preventPress'>
> & {
  colors: typeof Colors;
  message: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
  markdownRules?: MarkdownRules;
  markdownStyles?: MarkdownStyle;
  messageOverlay?: boolean;
  messageTextNumberOfLines?: number;
  onLink?: (url: string) => Promise<void>;
  onlyEmojis?: boolean;
};

export const renderText = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  params: RenderTextParams<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    colors,
    markdownRules,
    markdownStyles,
    message,
    messageOverlay,
    messageTextNumberOfLines,
    onLink: onLinkParams,
    onLongPress: onLongPressParam,
    onlyEmojis,
    onPress: onPressParam,
    preventPress,
  } = params;

  // take the @ mentions and turn them into markdown?
  // translate links
  const { mentioned_users, text } = message;

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

  const styles: MarkdownStyle = {
    ...defaultMarkdownStyles,
    ...markdownStyles,
    autolink: {
      ...defaultMarkdownStyles.autolink,
      color: colors.accent_blue,
      ...markdownStyles?.autolink,
    },
    inlineCode: {
      ...defaultMarkdownStyles.inlineCode,
      backgroundColor: colors.white_smoke,
      borderColor: colors.grey_gainsboro,
      color: colors.accent_red,
      ...markdownStyles?.inlineCode,
    },
    mentions: {
      ...defaultMarkdownStyles.mentions,
      color: colors.accent_blue,
      ...markdownStyles?.mentions,
    },
    text: {
      ...defaultMarkdownStyles.text,
      color: colors.black,
      ...markdownStyles?.text,
    },
  };

  const onLink = (url: string) =>
    onLinkParams
      ? onLinkParams(url)
      : Linking.canOpenURL(url).then((canOpenUrl) => canOpenUrl && Linking.openURL(url));

  const react: ReactNodeOutput = (node, output, { ...state }) => {
    const onPress = (event: GestureResponderEvent) => {
      if (!preventPress && onPressParam) {
        onPressParam({
          defaultHandler: () => onLink(node.target),
          emitter: 'textLink',
          event,
        });
      }
    };

    const onLongPress = (event: GestureResponderEvent) => {
      if (!preventPress && onLongPressParam) {
        onLongPressParam({
          emitter: 'textLink',
          event,
        });
      }
    };

    state.withinLink = true;
    const link = (
      <Text
        key={state.key}
        onLongPress={onLongPress}
        onPress={onPress}
        style={styles.autolink}
        suppressHighlighting={true}
      >
        {output(node.content, state)}
      </Text>
    );
    state.withinLink = false;
    return link;
  };

  const paragraphText: ReactNodeOutput = (node, output, { ...state }) => (
    <Text key={state.key} numberOfLines={messageTextNumberOfLines} style={styles.paragraph}>
      {output(node.content, state)}
    </Text>
  );

  const mentionedUsers = Array.isArray(mentioned_users)
    ? mentioned_users.reduce((acc, cur) => {
        const userName = cur.name || cur.id || '';
        if (userName) {
          acc += `${acc.length ? '|' : ''}@${userName}`;
        }
        return acc;
      }, '')
    : '';

  const regEx = new RegExp(`^\\B(${mentionedUsers})`, 'g');
  const match: MatchFunction = (source) => regEx.exec(source);

  const mentionsReact: ReactNodeOutput = (node, output, { ...state }) => {
    const onPress = (event: GestureResponderEvent) => {
      if (!preventPress && onPressParam) {
        onPressParam({
          emitter: 'textMention',
          event,
        });
      }
    };

    const onLongPress = (event: GestureResponderEvent) => {
      if (!preventPress && onLongPressParam) {
        onLongPressParam({
          emitter: 'textMention',
          event,
        });
      }
    };

    return (
      <Text key={state.key} onLongPress={onLongPress} onPress={onPress} style={styles.mentions}>
        {Array.isArray(node.content) ? node.content[0]?.content || '' : output(node.content, state)}
      </Text>
    );
  };

  const customRules = {
    link: { react },
    // Truncate long text content in the message overlay
    paragraph: messageTextNumberOfLines ? { react: paragraphText } : {},
    // we have no react rendering support for reflinks
    reflink: { match: () => null },
    ...(mentionedUsers
      ? {
          mentions: {
            match,
            order: defaultRules.text.order - 0.5,
            parse,
            react: mentionsReact,
          },
        }
      : {}),
  };

  return (
    <Markdown
      key={`${JSON.stringify(mentioned_users)}-${onlyEmojis}-${
        messageOverlay ? JSON.stringify(markdownStyles) : undefined
      }`}
      onLink={onLink}
      rules={{
        ...customRules,
        ...markdownRules,
      }}
      styles={styles}
    >
      {newText}
    </Markdown>
  );
};
