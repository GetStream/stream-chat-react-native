import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { LocalMessage } from 'stream-chat';

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

const styles = StyleSheet.create({
  textContainer: { maxWidth: 250, paddingHorizontal: 16 },
});

export type MessageTextProps = MessageTextContainerProps & {
  renderText: (params: RenderTextParams) => React.ReactNode | null;
  theme: { theme: Theme };
};

export type MessageTextContainerPropsWithContext = Pick<
  MessageContextValue,
  'message' | 'onLongPress' | 'onlyEmojis' | 'onPress' | 'preventPress'
> &
  Pick<
    MessagesContextValue,
    'markdownRules' | 'MessageText' | 'myMessageTheme' | 'messageTextNumberOfLines'
  > & {
    markdownStyles?: MarkdownStyle;
    messageOverlay?: boolean;
    styles?: Partial<{
      textContainer: StyleProp<ViewStyle>;
    }>;
  };

const MessageTextContainerWithContext = (props: MessageTextContainerPropsWithContext) => {
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

  const translatedMessage = useTranslatedMessage(message) as LocalMessage;

  if (!message.text) {
    return null;
  }

  const markdownStyles = { ...markdown, ...markdownStylesProp };

  return (
    <View
      style={[styles.textContainer, textContainer, stylesProp.textContainer]}
      testID='message-text-container'
    >
      {MessageText ? (
        <MessageText {...props} renderText={renderText} theme={theme} />
      ) : (
        renderText({
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

const areEqual = (
  prevProps: MessageTextContainerPropsWithContext,
  nextProps: MessageTextContainerPropsWithContext,
) => {
  const {
    markdownStyles: prevMarkdownStyles,
    message: prevMessage,
    myMessageTheme: prevMyMessageTheme,
    onlyEmojis: prevOnlyEmojis,
  } = prevProps;
  const {
    markdownStyles: nextMarkdownStyles,
    message: nextMessage,
    myMessageTheme: nextMyMessageTheme,
    onlyEmojis: nextOnlyEmojis,
  } = nextProps;

  const messageStatusEqual = prevMessage.status === nextMessage.status;
  if (!messageStatusEqual) {
    return false;
  }

  const messageTextEqual =
    prevMessage.text === nextMessage.text && prevMessage.i18n === nextMessage.i18n;
  if (!messageTextEqual) {
    return false;
  }

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) {
    return false;
  }

  const mentionedUsersEqual =
    prevMessage.mentioned_users?.length === nextMessage.mentioned_users?.length &&
    (nextMessage.mentioned_users?.length === 0 ||
      (prevMessage.mentioned_users?.length &&
        nextMessage.mentioned_users?.length &&
        prevMessage.mentioned_users[0].name === nextMessage.mentioned_users[0].name));
  if (!mentionedUsersEqual) {
    return false;
  }

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
  if (!markdownStylesEqual) {
    return false;
  }

  const messageThemeEqual =
    JSON.stringify(prevMyMessageTheme) === JSON.stringify(nextMyMessageTheme);
  if (!messageThemeEqual) {
    return false;
  }

  return true;
};

const MemoizedMessageTextContainer = React.memo(
  MessageTextContainerWithContext,
  areEqual,
) as typeof MessageTextContainerWithContext;

export type MessageTextContainerProps = Partial<MessageTextContainerPropsWithContext>;

export const MessageTextContainer = (props: MessageTextContainerProps) => {
  const { message, onLongPress, onlyEmojis, onPress, preventPress } = useMessageContext();
  const { markdownRules, MessageText, messageTextNumberOfLines, myMessageTheme } =
    useMessagesContext();

  return (
    <MemoizedMessageTextContainer
      {...{
        markdownRules,
        message,
        MessageText,
        messageTextNumberOfLines,
        myMessageTheme,
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
