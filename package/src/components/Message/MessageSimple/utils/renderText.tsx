import React from 'react';
import { GestureResponderEvent, Linking, Text, View } from 'react-native';

// @ts-expect-error
import Markdown from 'react-native-markdown-package';

import truncate from 'lodash/truncate';
import {
  DefaultRules,
  defaultRules,
  MatchFunction,
  ParseFunction,
  parseInline,
  ReactNodeOutput,
  SingleASTNode,
} from 'simple-markdown';

import type { MessageContextValue } from '../../../../contexts/messageContext/MessageContext';
import type { Colors, MarkdownStyle } from '../../../../contexts/themeContext/utils/theme';
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
import type { MessageType } from '../../../MessageList/hooks/useMessageList';
import { parseUrlsFromText } from './parseUrls';

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
  listItemNumber: {
    fontWeight: 'bold',
  },
  listItemText: {
    flex: 0,
  },
  listRow: {
    flexDirection: 'row',
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
  const urls = parseUrlsFromText(newText);

  for (const urlInfo of urls) {
    const displayLink = truncate(urlInfo.encoded, {
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

    return (
      <Text
        key={state.key}
        onLongPress={onLongPress}
        onPress={onPress}
        style={styles.autolink}
        suppressHighlighting={true}
      >
        {output(node.content, { ...state, withinLink: true })}
      </Text>
    );
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
        {Array.isArray(node.content) ? node.content[0].content || '' : output(node.content, state)}
      </Text>
    );
  };

  const listLevels = {
    sub: 'sub',
    top: 'top',
  };

  /**
   * For lists and sublists, the default behavior of the markdown library we use is
   * to always renumber any list, so all ordered lists start from 1.
   *
   * This custom rule overrides this behavior both for top level lists and sublists,
   * in order to start the numbering from the number of the first list item provided.
   * */
  const customListAtLevel =
    (level: keyof typeof listLevels): ReactNodeOutput =>
    (node, output, { ...state }) => {
      const items = node.items.map((item: Array<SingleASTNode>, index: number) => {
        const withinList = item.length > 1 && item[1].type === 'list';
        const content = output(item, { ...state, withinList });

        const isTopLevelText =
          ['text', 'paragraph', 'strong'].includes(item[0].type) && withinList === false;

        return (
          <View key={index} style={styles.listRow}>
            <Text style={styles.listItemNumber}>
              {node.ordered ? `${node.start + index}. ` : `\u2022`}
            </Text>
            <Text style={[styles.listItemText, isTopLevelText && { marginBottom: 0 }]}>
              {content}
            </Text>
          </View>
        );
      });

      const isSublist = level === 'sub';
      return (
        <View key={state.key} style={[isSublist ? styles.list : styles.sublist]}>
          {items}
        </View>
      );
    };

  const customRules = {
    link: { react },
    list: { react: customListAtLevel('top') },
    // Truncate long text content in the message overlay
    paragraph: messageTextNumberOfLines ? { react: paragraphText } : {},
    // we have no react rendering support for reflinks
    reflink: { match: () => null },
    sublist: { react: customListAtLevel('sub') },
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
      }-${JSON.stringify(colors)}`}
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
