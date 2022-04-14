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
import type { DefaultStreamChatGenerics } from '../../../types/types';
import { useTranslationContext } from '../../../contexts';
import { MessageType } from '../../MessageList/hooks/useMessageList';
import { TranslationLanguages } from 'stream-chat/src/types';

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

//todo: This has to be changed in the future and is depending on a change in the js client stream-chat/src/types.ts:491
type I18nTextKey = `${TranslationLanguages}_text`;

export const useTranslatedMessage = <StreamChatGenerics,>(
  message: MessageType<StreamChatGenerics>,
) => {
  const { userLanguage } = useTranslationContext();

  if (message.i18n !== undefined) {
    const i18nTextKey = `${userLanguage}_text` as I18nTextKey;
    const translationExistsInUserLanguage = i18nTextKey in message.i18n;
    if (translationExistsInUserLanguage) return message.i18n[i18nTextKey];
  }

  return message.text;
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
  const text = useTranslatedMessage(message);

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
        renderText<StreamChatGenerics>({
          text,
          colors,
          markdownRules,
          markdownStyles: {
            ...markdownStyles,
            ...(onlyEmojis ? onlyEmojiMarkdown : {}),
          },
          mentionedUsers: message.mentioned_users,
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
