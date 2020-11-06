import React from 'react';
import { StyleSheet, View } from 'react-native';

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

import { emojiRegex } from '../../../utils/utils';

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
  textContainer: { marginTop: 2, maxWidth: 250, paddingHorizontal: 16 },
  textContainerAlignmentLeft: {
    alignSelf: 'flex-start',
  },
  textContainerAlignmentRight: {
    alignSelf: 'flex-end',
  },
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
  'alignment' | 'groupStyles' | 'message'
> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'markdownRules' | 'MessageText'
  > & { theme: { theme: Theme }; markdownStyles?: MarkdownStyle };

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
  const {
    alignment,
    groupStyles,
    markdownRules,
    markdownStyles: propMarkdownStyles = {},
    message,
    MessageText,
    theme,
  } = props;

  const {
    theme: {
      colors: { light, transparent },
      messageSimple: {
        content: {
          markdown,
          textContainer: {
            borderRadiusL,
            borderRadiusS,
            leftBorderColor,
            leftBorderWidth,
            onlyEmojiLeftBorderColor,
            onlyEmojiMarkdown,
            onlyEmojiRightBorderColor,
            rightBorderColor,
            rightBorderWidth,
            ...textContainer
          },
        },
      },
    },
  } = theme;

  if (!message.text) return null;

  const onlyEmojis = emojiRegex.test(message.text);

  const groupStyle = `${alignment}_${(Array.isArray(message.attachments) &&
  message.attachments.length > 0
    ? 'bottom'
    : groupStyles[0]
  ).toLowerCase()}`;

  const markdownStyles = propMarkdownStyles || markdown || {};

  return (
    <View
      style={[
        styles.textContainer,
        alignment === 'left'
          ? {
              ...styles.textContainerAlignmentLeft,
              borderColor: onlyEmojis
                ? onlyEmojiLeftBorderColor
                : leftBorderColor,
              borderWidth: leftBorderWidth,
            }
          : {
              ...styles.textContainerAlignmentRight,
              borderColor: onlyEmojis
                ? onlyEmojiRightBorderColor
                : rightBorderColor,
              borderWidth: rightBorderWidth,
            },
        {
          backgroundColor: onlyEmojis
            ? transparent
            : alignment === 'left' ||
              message.type === 'error' ||
              message.status === 'failed'
            ? '#FFFFFF'
            : light,
          borderBottomLeftRadius:
            groupStyle === 'left_bottom' || groupStyle === 'left_single'
              ? borderRadiusS
              : borderRadiusL,
          borderBottomRightRadius:
            groupStyle === 'right_bottom' || groupStyle === 'right_single'
              ? borderRadiusS
              : borderRadiusL,
          borderTopLeftRadius: borderRadiusL,
          borderTopRightRadius: borderRadiusL,
        },
        textContainer,
      ]}
      testID='message-text-container'
    >
      {MessageText ? (
        <MessageText {...props} renderText={renderText} theme={theme} />
      ) : (
        renderText<At, Ch, Co, Ev, Me, Re, Us>({
          markdownRules,
          markdownStyles: {
            ...markdownStyles,
            ...(onlyEmojis ? onlyEmojiMarkdown : {}),
          },
          message,
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
  const { message: prevMessage } = prevProps;
  const { message: nextMessage } = nextProps;

  const messageTextEqual = prevMessage.text === nextMessage.text;

  return messageTextEqual;
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
  const { alignment, groupStyles, message } = useMessageContext<
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
  const theme = useTheme();

  return (
    <MemoizedMessageTextContainer
      {...{
        alignment,
        groupStyles,
        markdownRules,
        message,
        MessageText,
        theme,
      }}
      {...props}
    />
  );
};

MessageTextContainer.displayName =
  'MessageTextContainer{messageSimple{content}}';
