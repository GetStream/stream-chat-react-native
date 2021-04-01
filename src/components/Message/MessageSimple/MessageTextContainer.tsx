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

import type {
  MarkdownStyle,
  Theme,
} from '../../../contexts/themeContext/utils/theme';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

const styles = StyleSheet.create({
  textContainer: { maxWidth: 250, paddingHorizontal: 16 },
});

export type MessageTextProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = MessageTextContainerProps<At, Ch, Co, Ev, Me, Re, Us> & {
  renderText: (
    params: RenderTextParams<At, Ch, Co, Ev, Me, Re, Us>,
  ) => JSX.Element | null;
  theme: { theme: Theme };
};

export type MessageTextContainerPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
  'message' | 'onLongPress' | 'onlyEmojis' | 'onPress'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'markdownRules' | 'MessageText'
  > & {
    markdownStyles?: MarkdownStyle;
    styles?: Partial<{
      textContainer: StyleProp<ViewStyle>;
    }>;
  };

const MessageTextContainerWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageTextContainerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const theme = useTheme();

  const {
    markdownRules,
    markdownStyles: markdownStylesProp = {},
    message,
    MessageText,
    onLongPress,
    onlyEmojis,
    onPress,
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
        renderText<At, Ch, Co, Ev, Me, Re, Us>({
          colors,
          markdownRules,
          markdownStyles: {
            ...markdownStyles,
            ...(onlyEmojis ? onlyEmojiMarkdown : {}),
          },
          message,
          onLongPress,
          onlyEmojis,
          onPress,
        })
      )}
    </View>
  );
};

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: MessageTextContainerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: MessageTextContainerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message: prevMessage, onlyEmojis: prevOnlyEmojis } = prevProps;
  const { message: nextMessage, onlyEmojis: nextOnlyEmojis } = nextProps;

  const messageTextEqual = prevMessage.text === nextMessage.text;
  if (!messageTextEqual) return false;

  const onlyEmojisEqual = prevOnlyEmojis === nextOnlyEmojis;
  if (!onlyEmojisEqual) return false;

  const mentionedUsersEqual =
    prevMessage.mentioned_users?.length ===
      nextMessage.mentioned_users?.length &&
    (nextMessage.mentioned_users?.length === 0 ||
      (prevMessage.mentioned_users?.length &&
        nextMessage.mentioned_users?.length &&
        prevMessage.mentioned_users[0].name ===
          nextMessage.mentioned_users[0].name));
  if (!mentionedUsersEqual) return false;

  return true;
};

const MemoizedMessageTextContainer = React.memo(
  MessageTextContainerWithContext,
  areEqual,
) as typeof MessageTextContainerWithContext;

export type MessageTextContainerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<MessageTextContainerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageTextContainer = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageTextContainerProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { message, onLongPress, onlyEmojis, onPress } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { markdownRules, MessageText } = useMessagesContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  return (
    <MemoizedMessageTextContainer
      {...{
        markdownRules,
        message,
        MessageText,
        onLongPress,
        onlyEmojis,
        onPress,
      }}
      {...props}
    />
  );
};

MessageTextContainer.displayName =
  'MessageTextContainer{messageSimple{content}}';
