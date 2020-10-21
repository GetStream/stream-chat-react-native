import React from 'react';
import { StyleSheet, View } from 'react-native';

import { capitalize } from './utils/capitalize';
import { renderText } from './utils/renderText';

import { useTheme } from '../../../contexts/themeContext/ThemeContext';

import type { MessageSimpleProps } from './MessageSimple';
import type { RenderTextParams } from './utils/renderText';

import type {
  Alignment,
  GroupType,
} from '../../../contexts/messagesContext/MessagesContext';
import type { Theme } from '../../../contexts/themeContext/utils/theme';
import type { Message as MessageType } from '../../../components/MessageList/utils/insertDates';
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
  textContainer: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 5 },
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

export type MessageTextContainerProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: Alignment;
  /**
   * Whether or not the message has failed
   */
  disabled: boolean;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: GroupType[];
  /** Handler to process a reaction */
  handleReaction: (reactionType: string) => Promise<void>;
  /**
   * Returns true if message belongs to current user, else false
   */
  isMyMessage: (message: MessageType<At, Ch, Co, Ev, Me, Re, Us>) => boolean;
  /**
   * Current [message object](https://getstream.io/chat/docs/#message_format)
   */
  message: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Handler to open and navigate into a message thread
   */
  openThread: () => void;
  /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
  markdownRules?: UnknownType;
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   * */
  Message?: React.ComponentType<MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Custom UI component for message text
   */
  MessageText?: React.ComponentType<
    MessageTextProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
};

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
  const {
    alignment,
    groupStyles = ['bottom'],
    markdownRules = {},
    message,
    MessageText,
  } = props;
  const theme = useTheme();
  const {
    theme: {
      colors: { light, transparent },
      message: {
        content: {
          markdown,
          textContainer: {
            borderRadiusL,
            borderRadiusS,
            leftBorderColor,
            leftBorderWidth,
            rightBorderColor,
            rightBorderWidth,
            ...textContainer
          },
        },
      },
    },
  } = theme;

  if (!message.text) return null;

  const groupStyle =
    alignment +
    capitalize(
      Array.isArray(message.attachments) && message.attachments.length > 0
        ? 'bottom'
        : groupStyles[0],
    );
  const markdownStyles = theme ? markdown : {};

  return (
    <View
      style={[
        styles.textContainer,
        alignment === 'left'
          ? {
              ...styles.textContainerAlignmentLeft,
              borderColor: leftBorderColor,
              borderWidth: leftBorderWidth,
            }
          : {
              ...styles.textContainerAlignmentRight,
              borderColor: rightBorderColor,
              borderWidth: rightBorderWidth,
            },
        {
          backgroundColor:
            alignment === 'left' ||
            message.type === 'error' ||
            message.status === 'failed'
              ? transparent
              : light,
          borderBottomLeftRadius:
            groupStyle.indexOf('left') !== -1 ? borderRadiusS : borderRadiusL,
          borderBottomRightRadius:
            groupStyle.indexOf('right') !== -1 ? borderRadiusS : borderRadiusL,
          borderTopLeftRadius:
            groupStyle === 'leftBottom' || groupStyle === 'leftMiddle'
              ? borderRadiusS
              : borderRadiusL,
          borderTopRightRadius:
            groupStyle === 'rightBottom' || groupStyle === 'rightMiddle'
              ? borderRadiusS
              : borderRadiusL,
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
          markdownStyles,
          message,
        })
      )}
    </View>
  );
};

MessageTextContainer.displayName = 'MessageTextContainer{message{content}}';
