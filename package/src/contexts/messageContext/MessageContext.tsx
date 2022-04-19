import React, { PropsWithChildren, useContext } from 'react';

import type { Attachment } from 'stream-chat';

import type { ActionHandler } from '../../components/Attachment/Attachment';
import type { TouchableHandlerPayload } from '../../components/Message/Message';
import type { GroupType, MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { ChannelContextValue } from '../../contexts/channelContext/ChannelContext';
import type { MessageContentType } from '../../contexts/messagesContext/MessagesContext';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type Alignment = 'right' | 'left';

export type Reactions = {
  own: boolean;
  type: string;
}[];

export type MessageContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /** Whether or not actions can be performed on message */
  actionsEnabled: boolean;
  /** Position of the message, either 'right' or 'left' */
  alignment: Alignment;
  /** The files attached to a message */
  files: Attachment<StreamChatGenerics>[];
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: GroupType[];
  /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
  handleAction: ActionHandler;
  handleDeleteMessage: () => Promise<void>;
  handleEditMessage: () => void;
  handleQuotedReplyMessage: () => void;
  handleResendMessage: () => Promise<void>;
  handleToggleBanUser: () => Promise<void>;
  handleToggleMuteUser: () => Promise<void>;
  handleToggleReaction: (reactionType: string) => Promise<void>;
  /** Whether or not message has reactions */
  hasReactions: boolean;
  /** The images attached to a message */
  images: Attachment<StreamChatGenerics>[];
  /** Whether or not this is the active user's message */
  isMyMessage: boolean;
  /** Whether or not this is the last message in a group of messages */
  lastGroupMessage: boolean;
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: MessageType<StreamChatGenerics>;
  /** Order to render the message content */
  messageContentOrder: MessageContentType[];
  /**
   * You can call methods available on the Message
   * component such as handleEdit, handleDelete, handleAction etc.
   *
   * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/Message/Message.tsx)
   *
   * By default, we show the overlay with all the message actions on long press.
   *
   * @param event   Event object for onLongPress event
   */
  onLongPress: (payload: TouchableHandlerPayload) => void;
  /** Whether the message is only text and the text is only emojis */
  onlyEmojis: boolean;
  /** Handler to open a thread on a message */
  onOpenThread: () => void;
  /**
   * You can call methods available on the Message
   * component such as handleEdit, handleDelete, handleAction etc.
   *
   * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/components/Message/Message.tsx)
   *
   * By default, we will dismiss the keyboard on press.
   *
   * @param event   Event object for onPress event
   */
  onPress: (payload: TouchableHandlerPayload) => void;
  onPressIn: ((payload: TouchableHandlerPayload) => void) | null;
  /** The images attached to a message */
  otherAttachments: Attachment<StreamChatGenerics>[];
  reactions: Reactions;
  showMessageOverlay: (messageReactions?: boolean) => void;
  showMessageStatus: boolean;
  /** Whether or not the Message is part of a Thread */
  threadList: boolean;
  goToMessage?: (messageId: string) => void;
  /** Latest message id on current channel */
  lastReceivedId?: string;
  /** Prevent message being pressed for image viewer view */
  preventPress?: boolean;
  /** Whether or not the avatar show show next to Message */
  showAvatar?: boolean;
} & Pick<ChannelContextValue<StreamChatGenerics>, 'channel' | 'disabled' | 'members'>;

export const MessageContext = React.createContext({} as MessageContextValue);

export const MessageProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value?: MessageContextValue<StreamChatGenerics>;
}>) => (
  <MessageContext.Provider value={value as unknown as MessageContextValue}>
    {children}
  </MessageContext.Provider>
);

export const useMessageContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => useContext(MessageContext) as unknown as MessageContextValue<StreamChatGenerics>;

/**
 * Typescript currently does not support partial inference so if MessageContext
 * typing is desired while using the HOC withMessageContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessageContextValue<StreamChatGenerics>>> => {
  const WithMessageContextComponent = (
    props: Omit<P, keyof MessageContextValue<StreamChatGenerics>>,
  ) => {
    const messageContext = useMessageContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...messageContext} />;
  };
  WithMessageContextComponent.displayName = `WithMessageContext${getDisplayName(Component)}`;
  return WithMessageContextComponent;
};
