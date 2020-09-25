import React, { useContext } from 'react';

import { capitalize } from './utils/capitalize';
import { renderText } from './utils/renderText';

import { styled, ThemeContext } from '../../../styles/styledComponents';

import type { MessageSimpleProps } from './MessageSimple';
import type {
  Alignment,
  GroupType,
} from '../../../contexts/messagesContext/MessagesContext';
import type { Message as MessageType } from '../../../components/MessageList/utils/insertDates';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

const TextContainer = styled.View<{
  alignment: string;
  groupStyle: string;
  status?: string;
  type?: string;
}>`
  align-self: ${({ alignment }) =>
    alignment === 'left' ? 'flex-start' : 'flex-end'};
  background-color: ${({ alignment, status, theme, type }) =>
    alignment === 'left' || type === 'error' || status === 'failed'
      ? theme.colors.transparent
      : theme.colors.light};
  border-bottom-left-radius: ${({ groupStyle, theme }) =>
    groupStyle.indexOf('left') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  border-bottom-right-radius: ${({ groupStyle, theme }) =>
    groupStyle.indexOf('right') !== -1
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  border-color: ${({ alignment, theme }) =>
    alignment === 'left'
      ? theme.message.content.textContainer.leftBorderColor
      : theme.message.content.textContainer.rightBorderColor};
  border-top-left-radius: ${({ groupStyle, theme }) =>
    groupStyle === 'leftBottom' || groupStyle === 'leftMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  border-top-right-radius: ${({ groupStyle, theme }) =>
    groupStyle === 'rightBottom' || groupStyle === 'rightMiddle'
      ? theme.message.content.textContainer.borderRadiusS
      : theme.message.content.textContainer.borderRadiusL}px;
  border-width: ${({ alignment, theme }) =>
    alignment === 'left'
      ? theme.message.content.textContainer.leftBorderWidth
      : theme.message.content.textContainer.rightBorderWidth}px;
  margin-top: 2px;
  padding-horizontal: 8px;
  padding-vertical: 5px;
  ${({ theme }) => theme.message.content.textContainer.css}
`;

export type MessageTextContainerProps<
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
> = {
  /**
   * Position of the message, either 'right' or 'left'
   */
  alignment: Alignment;
  /**
   * Whether or not the message has failed or errored
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
  isMyMessage: () => boolean;
  /**
   * Current [message object](https://getstream.io/chat/docs/#message_format)
   */
  message: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
  /**
   * Custom UI component to display a message in MessageList component
   * Default component (accepts the same props): [MessageSimple](https://getstream.github.io/stream-chat-react-native/#messagesimple)
   * */
  Message: React.ComponentType<MessageSimpleProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Handler to open and navigate into a message thread
   */
  openThread: () => void;
  /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
  markdownRules?: Record<string, unknown>;
  /**
   * Custom UI component for message text
   */
  MessageText?: React.ComponentType<Partial<any>>;
};

const MessageTextContainer = <
  At extends Record<string, unknown> = DefaultAttachmentType,
  Ch extends Record<string, unknown> = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends Record<string, unknown> = DefaultEventType,
  Me extends Record<string, unknown> = DefaultMessageType,
  Re extends Record<string, unknown> = DefaultReactionType,
  Us extends Record<string, unknown> = DefaultUserType
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
  const theme = useContext(ThemeContext);

  if (!message.text) return null;

  const groupStyle =
    alignment +
    capitalize(
      Array.isArray(message.attachments) && message.attachments.length > 0
        ? 'bottom'
        : groupStyles[0],
    );
  const markdownStyles = theme ? theme.message.content.markdown : {};

  return (
    <TextContainer
      alignment={alignment}
      groupStyle={groupStyle}
      status={message.status}
      testID='message-text-container'
      type={message.type}
    >
      {MessageText ? (
        <MessageText {...props} renderText={renderText} theme={theme} />
      ) : (
        renderText({ markdownRules, markdownStyles, message })
      )}
    </TextContainer>
  );
};

export default MessageTextContainer;
