import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { renderText, RenderTextParams } from './utils/renderText';

import {
  MessageContextValue,
  useMessageContext,
} from '../../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type { MarkdownStyle, Theme } from '../../../contexts/themeContext/utils/theme';
import { useTranslatedMessage } from '../../../hooks/useTranslatedMessage';
import type { DefaultStreamChatGenerics } from '../../../types/types';
import type { MessageType } from '../../MessageList/hooks/useMessageList';

const styles = StyleSheet.create({
  textContainer: { maxWidth: 250, paddingHorizontal: 16 },
});

export type MessageTextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = MessageTextContainerProps<StreamChatGenerics> & {
  renderText: (params: RenderTextParams<StreamChatGenerics>) => JSX.Element | null;
  theme: { theme: Theme };
};

export type MessageTextContainerPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatGenerics>,
  'message' | 'onLongPress' | 'onlyEmojis' | 'onPress' | 'preventPress'
> &
  Pick<MessagesContextValue<StreamChatGenerics>, 'markdownRules' | 'MessageText'> & {
    markdownStyles?: MarkdownStyle;
    messageOverlay?: boolean;
    messageTextNumberOfLines?: number;
    styles?: Partial<{
      textContainer: StyleProp<ViewStyle>;
    }>;
  };

const MessageTextContainerWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageTextContainerPropsWithContext<StreamChatGenerics>,
) => {
  const theme = useTheme();

  const {
    markdownRules,
    markdownStyles: markdownStylesProp = {},
    message,
    messageOverlay,
    MessageText,
    messageTextNumberOfLines,
    onLongPress,
    onlyEmojis,
    onPress,
    preventPress,
    styles: stylesProp = {},
  } = props;

  const {
    theme: {
      colors,
      messageSimple: {
        content: {
          markdown,
          textContainer: { onlyEmojiMarkdown, ...textContainer },
        },
      },
    },
  } = theme;

  const translatedMessage = useTranslatedMessage<StreamChatGenerics>(
    message,
  ) as MessageType<StreamChatGenerics>;

  if (!message.text) return null;

  const markdownStyles = { ...markdown, ...markdownStylesProp };

  return (
    <View
      style={[styles.textContainer, textContainer, stylesProp.textContainer]}
      testID='message-text-container'
    >
      {MessageText ? (
        <MessageText {...props} renderText={renderText} theme={theme} />
      ) : (
        renderText<StreamChatGenerics>({
          colors,
          markdownRules,
          markdownStyles: {
            ...markdownStyles,
            ...(onlyEmojis ? onlyEmojiMarkdown : {}),
          },
          message: translatedMessage,
          messageOverlay,
          messageTextNumberOfLines,
          onLongPress,
          onlyEmojis,
          onPress,
          preventPress,
        })
      )}
    </View>
  );
};

const areEqual = <StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageTextContainerPropsWithContext<StreamChatGenerics>,
  nextProps: MessageTextContainerPropsWithContext<StreamChatGenerics>,
) => {
  const {
    markdownStyles: prevMarkdownStyles,
    message: prevMessage,
    onlyEmojis: prevOnlyEmojis,
  } = prevProps;
  const {
    markdownStyles: nextMarkdownStyles,
    message: nextMessage,
    onlyEmojis: nextOnlyEmojis,
  } = nextProps;

  const messageTextEqual = prevMessage.text === nextMessage.text;
  if (!messageTextEqual) return false;

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) return false;

  const mentionedUsersEqual =
    prevMessage.mentioned_users?.length === nextMessage.mentioned_users?.length &&
    (nextMessage.mentioned_users?.length === 0 ||
      (prevMessage.mentioned_users?.length &&
        nextMessage.mentioned_users?.length &&
        prevMessage.mentioned_users[0].name === nextMessage.mentioned_users[0].name));
  if (!mentionedUsersEqual) return false;

  // stringify could be an expensive operation, so lets rule out the obvious
  // possibilities first such as different object reference or empty objects etc.
  // Also keeping markdown equality check at the last to make sure other less
  // expensive equality checks get executed first and markdown check will be skipped if returned
  // false from previous checks.
  const markdownStylesEqual =
    prevMarkdownStyles === nextMarkdownStyles ||
    (Object.keys(prevMarkdownStyles || {}).length === 0 &&
      Object.keys(nextMarkdownStyles || {}).length === 0) ||
    JSON.stringify(prevMarkdownStyles) === JSON.stringify(nextMarkdownStyles);
  if (!markdownStylesEqual) return false;

  return true;
};

const MemoizedMessageTextContainer = React.memo(
  MessageTextContainerWithContext,
  areEqual,
) as typeof MessageTextContainerWithContext;

export type MessageTextContainerProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageTextContainerPropsWithContext<StreamChatGenerics>>;

export const MessageTextContainer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageTextContainerProps<StreamChatGenerics>,
) => {
  const { message, onLongPress, onlyEmojis, onPress, preventPress } =
    useMessageContext<StreamChatGenerics>();
  const { markdownRules, MessageText } = useMessagesContext<StreamChatGenerics>();
  const { messageTextNumberOfLines } = props;

  return (
    <MemoizedMessageTextContainer
      {...{
        markdownRules,
        message,
        MessageText,
        messageTextNumberOfLines,
        onLongPress,
        onlyEmojis,
        onPress,
        preventPress,
      }}
      {...props}
    />
  );
};

MessageTextContainer.displayName = 'MessageTextContainer{messageSimple{content}}';
