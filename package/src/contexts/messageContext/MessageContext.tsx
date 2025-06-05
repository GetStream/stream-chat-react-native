import React, { PropsWithChildren, useContext } from 'react';

import type { Attachment, LocalMessage } from 'stream-chat';

import type { ActionHandler } from '../../components/Attachment/Attachment';
import { ReactionSummary } from '../../components/Message/hooks/useProcessReactions';
import type {
  MessagePressableHandlerPayload,
  PressableHandlerPayload,
} from '../../components/Message/Message';
import type { GroupType } from '../../components/MessageList/hooks/useMessageList';
import type { ChannelContextValue } from '../../contexts/channelContext/ChannelContext';
import type { MessageContentType } from '../../contexts/messagesContext/MessagesContext';
import type { DeepPartial } from '../../contexts/themeContext/ThemeContext';
import type { Theme } from '../../contexts/themeContext/utils/theme';

import { MessageComposerAPIContextValue } from '../messageComposerContext/MessageComposerAPIContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

export type Alignment = 'right' | 'left';

export type MessageContextValue = {
  /** Whether or not actions can be performed on message */
  actionsEnabled: boolean;
  /** Position of the message, either 'right' or 'left' */
  alignment: Alignment;
  /**
   * Function to dismiss the overlay
   */
  dismissOverlay: () => void;
  /** The files attached to a message */
  files: Attachment[];
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: GroupType[];
  /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
  handleAction: ActionHandler;
  handleToggleReaction: (reactionType: string) => Promise<void>;
  /** Whether or not message has reactions */
  hasReactions: boolean;
  /** The images attached to a message */
  images: Attachment[];
  /** Boolean that determines if the edited message is pressed. */
  isEditedMessageOpen: boolean;
  /**
   * A factory function that determines whether a message is AI generated or not.
   */
  isMessageAIGenerated: (message: LocalMessage) => boolean;
  /** Whether or not this is the active user's message */
  isMyMessage: boolean;
  /** Whether or not this is the last message in a group of messages */
  lastGroupMessage: boolean;
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: LocalMessage;
  /** Order to render the message content */
  messageContentOrder: MessageContentType[];
  /**
   * You can call methods available on the Message
   * component such as handleEdit, handleDelete, handleAction etc.
   *
   * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/Message.tsx)
   *
   * By default, we show the overlay with all the message actions on long press.
   *
   * @param payload   Payload object for onLongPress event
   */
  onLongPress: (payload: PressableHandlerPayload) => void;
  /** Whether the message is only text and the text is only emojis */
  onlyEmojis: boolean;
  /** Handler to open a thread on a message */
  onOpenThread: () => void;
  /**
   * You can call methods available on the Message
   * component such as handleEdit, handleDelete, handleAction etc.
   *
   * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/Message.tsx)
   *
   * By default, we will dismiss the keyboard on press.
   *
   * @param payload   Payload object for onPress event
   */
  onPress: (payload: MessagePressableHandlerPayload) => void;
  onPressIn: ((payload: PressableHandlerPayload) => void) | null;
  /** The images attached to a message */
  otherAttachments: Attachment[];
  reactions: ReactionSummary[];
  /** Whether or not the message has been read by the current user */
  readBy: number | boolean;
  /** React set state function to set the state of `isEditedMessageOpen` */
  setIsEditedMessageOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Function to show the menu with all the message actions.
   * @param showMessageReactions
   * @returns void
   */
  showMessageOverlay: (showMessageReactions?: boolean, selectedReaction?: string) => void;
  showMessageStatus: boolean;
  /** Whether or not the Message is part of a Thread */
  threadList: boolean;
  /** The videos attached to a message */
  videos: Attachment[];
  goToMessage?: (messageId: string) => void;
  /**
   * Function to handle reaction on message
   * @param reactionType
   * @returns
   */
  handleReaction?: (reactionType: string) => Promise<void>;
  /** Latest message id on current channel */
  lastReceivedId?: string;
  /**
   * Theme provided only to messages that are the current users
   */
  myMessageTheme?: DeepPartial<Theme>;
  /** Prevent message being pressed for image viewer view */
  preventPress?: boolean;
  /** Whether or not the avatar show show next to Message */
  showAvatar?: boolean;
} & Pick<ChannelContextValue, 'channel' | 'members'> &
  Pick<MessageComposerAPIContextValue, 'setQuotedMessage'>;

export const MessageContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageContextValue,
);

export const MessageProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: MessageContextValue;
}>) => (
  <MessageContext.Provider value={value as unknown as MessageContextValue}>
    {children}
  </MessageContext.Provider>
);

export const useMessageContext = () => {
  const contextValue = useContext(MessageContext) as unknown as MessageContextValue;

  return contextValue;
};
