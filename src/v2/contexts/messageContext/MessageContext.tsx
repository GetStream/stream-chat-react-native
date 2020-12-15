import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { GestureResponderEvent } from 'react-native';
import type { Attachment } from 'stream-chat';

import type { ActionHandler } from '../../components/Attachment/Attachment';
import type { Message } from '../../components/MessageList/hooks/useMessageList';
import type {
  GroupType,
  MessageContentType,
} from '../../contexts/messagesContext/MessagesContext';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type Alignment = 'right' | 'left';

export type Reactions = {
  own: boolean;
  type: string;
}[];

export type MessageContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** Whether or not actions can be performed on message */
  actionsEnabled: boolean;
  /** Position of the message, either 'right' or 'left' */
  alignment: Alignment;
  /**
   * Should use gesture handler to animate longPress
   */
  animatedLongPress: boolean;
  /**
   * Function that returns a boolean indicating whether or not the user can edit/delete the message.
   */
  canModifyMessage: boolean;
  /** The files attached to a message */
  files: Attachment<At>[];
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: GroupType[];
  /** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands). */
  handleAction: ActionHandler;
  /** Whether or not message has reactions */
  hasReactions: boolean;
  /** The images attached to a message */
  images: Attachment<At>[];
  /** Whether or not this is the active user's message */
  isMyMessage: boolean;
  /** Whether or not this is the last message in a group of messages */
  lastGroupMessage: boolean;
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Message<At, Ch, Co, Ev, Me, Re, Us>;
  /** Order to render the message content */
  messageContentOrder: MessageContentType[];
  /**
   * You can call methods available on the Message
   * component such as handleEdit, handleDelete, handleAction etc.
   *
   * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/Message.tsx)
   *
   * By default, we show the overlay with all the message actions on long press.
   *
   * @param event   Event object for onLongPress event
   */
  onLongPress: (event?: GestureResponderEvent) => void;
  /** Whether the message is only text and the text is only emojis */
  onlyEmojis: boolean;
  /** Handler to open a thread on a message */
  onOpenThread: () => void;
  /**
   * You can call methods available on the Message
   * component such as handleEdit, handleDelete, handleAction etc.
   *
   * Source - [Message](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message/Message.tsx)
   *
   * By default, we will dismiss the keyboard on press.
   *
   * @param event   Event object for onPress event
   */
  onPress: (event: GestureResponderEvent) => void;
  /** The images attached to a message */
  otherAttachments: Attachment<At>[];
  reactions: Reactions;
  showMessageOverlay: (messageReactions?: boolean) => void;
  showMessageStatus: boolean;
  /** Whether or not the Message is part of a Thread */
  threadList: boolean;
  /** Latest message id on current channel */
  lastReceivedId?: string;
  /** Prevent message being pressed for image viewer view */
  preventPress?: boolean;
  /** Whether or not the avatar show show next to Message */
  showAvatar?: boolean;
};

export const MessageContext = React.createContext({} as MessageContextValue);

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: PropsWithChildren<{
    value: MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
  nextProps: PropsWithChildren<{
    value: MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
) => {
  const {
    value: {
      actionsEnabled: prevActionsEnabled,
      alignment: prevAlignment,
      animatedLongPress: prevAnimateLongPress,
      files: prevFiles,
      groupStyles: prevGroupStyles,
      hasReactions: prevHasReactions,
      images: prevImages,
      lastGroupMessage: prevLastGroupMessage,
      lastReceivedId: prevLastReceivedId,
      message: prevMessage,
      reactions: prevReactions,
      showAvatar: prevShowAvatar,
      showMessageStatus: prevShowMessageStatus,
      threadList: prevThreadList,
    },
  } = prevProps;
  const {
    value: {
      actionsEnabled: nextActionsEnabled,
      alignment: nextAlignment,
      animatedLongPress: nextAnimateLongPress,
      files: nextFiles,
      groupStyles: nextGroupStyles,
      hasReactions: nextHasReactions,
      images: nextImages,
      lastGroupMessage: nextLastGroupMessage,
      lastReceivedId: nextLastReceivedId,
      message: nextMessage,
      reactions: nextReactions,
      showAvatar: nextShowAvatar,
      showMessageStatus: nextShowMessageStatus,
      threadList: nextThreadList,
    },
  } = nextProps;

  const hasReactionsEqual = prevHasReactions === nextHasReactions;
  if (!hasReactionsEqual) return false;

  const lastGroupMessageEqual = prevLastGroupMessage === nextLastGroupMessage;
  if (!lastGroupMessageEqual) return false;

  const lastReceivedIdEqual = prevLastReceivedId === nextLastReceivedId;
  if (!lastReceivedIdEqual) return false;

  const groupStylesEqual = prevGroupStyles.length === nextGroupStyles.length;
  if (!groupStylesEqual) return false;

  const actionsEnabledEqual = prevActionsEnabled === nextActionsEnabled;
  if (!actionsEnabledEqual) return false;

  const alignmentEqual = prevAlignment === nextAlignment;
  if (!alignmentEqual) return false;

  const showAvatarEqual = prevShowAvatar === nextShowAvatar;
  if (!showAvatarEqual) return false;

  const showMessageStatusEqual =
    prevShowMessageStatus === nextShowMessageStatus;
  if (!showMessageStatusEqual) return false;

  const threadListEqual = prevThreadList === nextThreadList;
  if (!threadListEqual) return false;

  const filesEqual = prevFiles.length === nextFiles.length;
  if (!filesEqual) return false;

  const imagesEqual =
    prevImages.length === nextImages.length &&
    prevImages.every(
      (image, index) =>
        image.image_url === nextImages[index].image_url &&
        image.thumb_url === nextImages[index].thumb_url,
    );
  if (!imagesEqual) return false;

  const reactionsEqual =
    prevReactions.length === nextReactions.length &&
    prevReactions.every(
      (latestReaction, index) =>
        nextReactions[index].own === latestReaction.own &&
        nextReactions[index].type === latestReaction.type,
    );
  if (!reactionsEqual) return false;

  const animateLongPressQual = prevAnimateLongPress === nextAnimateLongPress;
  if (!animateLongPressQual) return false;

  const attachmentsEqual =
    (Array.isArray(prevMessage.attachments) &&
      Array.isArray(nextMessage.attachments) &&
      prevMessage.attachments.length === nextMessage.attachments.length) ||
    prevMessage.attachments === nextMessage.attachments;
  if (!attachmentsEqual) return false;

  const latestReactionsEqual =
    (Array.isArray(prevMessage.latest_reactions) &&
      Array.isArray(nextMessage.latest_reactions) &&
      prevMessage.latest_reactions.length ===
        nextMessage.latest_reactions.length) ||
    prevMessage.latest_reactions === nextMessage.latest_reactions;
  if (!latestReactionsEqual) return false;

  const messageEqual =
    prevMessage.deleted_at === nextMessage.deleted_at &&
    prevMessage.status === nextMessage.status &&
    prevMessage.type === nextMessage.type &&
    prevMessage.text === nextMessage.text;
  if (!messageEqual) return false;

  return true;
};

const MessageProviderMemoized = React.memo(
  MessageContext.Provider,
  areEqual,
) as typeof MessageContext.Provider;

export const MessageProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <MessageProviderMemoized value={(value as unknown) as MessageContextValue}>
    {children}
  </MessageProviderMemoized>
);

export const useMessageContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(MessageContext) as unknown) as MessageContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if MessageContext
 * typing is desired while using the HOC withMessageContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessageContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithMessageContextComponent = (
    props: Omit<P, keyof MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const messageContext = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...messageContext} />;
  };
  WithMessageContextComponent.displayName = `WithMessageContext${getDisplayName(
    Component,
  )}`;
  return WithMessageContextComponent;
};
