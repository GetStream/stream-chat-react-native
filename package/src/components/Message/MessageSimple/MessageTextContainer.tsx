import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ExtendableGenerics } from 'stream-chat';

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
import type { DefaultStreamChatGenerics } from '../../../types/types';

const styles = StyleSheet.create({
  textContainer: { maxWidth: 250, paddingHorizontal: 16 },
});

export type MessageTextProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = MessageTextContainerProps<StreamChatClient> & {
  renderText: (params: RenderTextParams<StreamChatClient>) => JSX.Element | null;
  theme: { theme: Theme };
};

export type MessageTextContainerPropsWithContext<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Pick<
  MessageContextValue<StreamChatClient>,
  'message' | 'onLongPress' | 'onlyEmojis' | 'onPress' | 'preventPress'
> &
  Pick<MessagesContextValue<StreamChatClient>, 'markdownRules' | 'MessageText'> & {
    markdownStyles?: MarkdownStyle;
    messageOverlay?: boolean;
    messageTextNumberOfLines?: number;
    styles?: Partial<{
      textContainer: StyleProp<ViewStyle>;
    }>;
  };

const MessageTextContainerWithContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageTextContainerPropsWithContext<StreamChatClient>,
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
        renderText<StreamChatClient>({
          colors,
          markdownRules,
          markdownStyles: {
            ...markdownStyles,
            ...(onlyEmojis ? onlyEmojiMarkdown : {}),
          },
          message,
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

const areEqual = <StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics>(
  prevProps: MessageTextContainerPropsWithContext<StreamChatClient>,
  nextProps: MessageTextContainerPropsWithContext<StreamChatClient>,
) => {
  const { message: prevMessage, onlyEmojis: prevOnlyEmojis } = prevProps;
  const { message: nextMessage, onlyEmojis: nextOnlyEmojis } = nextProps;

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

  return true;
};

const MemoizedMessageTextContainer = React.memo(
  MessageTextContainerWithContext,
  areEqual,
) as typeof MessageTextContainerWithContext;

export type MessageTextContainerProps<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = Partial<MessageTextContainerPropsWithContext<StreamChatClient>>;

export const MessageTextContainer = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  props: MessageTextContainerProps<StreamChatClient>,
) => {
  const { message, onLongPress, onlyEmojis, onPress, preventPress } =
    useMessageContext<StreamChatClient>();
  const { markdownRules, MessageText } = useMessagesContext<StreamChatClient>();
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
