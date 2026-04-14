import React, { PropsWithChildren, useContext } from 'react';

import { PressableProps, ViewProps } from 'react-native';

import type {
  Attachment,
  Channel,
  ChannelState,
  CommandSuggestion,
  DeleteMessageOptions,
  LocalMessage,
  MessageResponse,
} from 'stream-chat';

import type { MessagePressableHandlerPayload } from '../../components/Message/Message';
import type { MarkdownRules } from '../../components/Message/MessageItemView/utils/renderText';
import type { MessageActionsParams } from '../../components/Message/utils/messageActions';
import type {
  GroupStyle,
  MessageGroupStylesParams,
} from '../../components/MessageList/utils/getGroupStyles';
import type { MessageActionType } from '../../components/MessageMenu/MessageActionListItem';
import { NativeHandlers } from '../../native';

import type { ReactionData } from '../../utils/utils';
import type { Alignment, MessageContextValue } from '../messageContext/MessageContext';
import type { DeepPartial } from '../themeContext/ThemeContext';
import type { Theme } from '../themeContext/utils/theme';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageContentType =
  | 'attachments'
  | 'files'
  | 'gallery'
  | 'quoted_reply'
  | 'poll'
  | 'ai_text'
  | 'text'
  | 'location';
export type DeletedMessagesVisibilityType = 'always' | 'never' | 'receiver' | 'sender';

export type MessageLocationProps = {
  message: LocalMessage;
};

export type MessagesContextValue = Pick<MessageContextValue, 'isMessageAIGenerated'> & {
  // FIXME: Remove the signature with optionsOrHardDelete boolean with the next major release
  deleteMessage: (
    message: LocalMessage,
    optionsOrHardDelete?: boolean | DeleteMessageOptions,
  ) => Promise<void>;
  deleteReaction: (type: string, messageId: string) => Promise<void>;

  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch: boolean;

  enableMessageGroupingByUser: boolean;

  /**
   * The type of URL preview to render.
   * Defaults to: 'full'
   */
  urlPreviewType: 'compact' | 'full';

  FlatList: typeof NativeHandlers.FlatList | undefined;
  /**
   * The giphy version to render - check the keys of the [Image Object](https://developers.giphy.com/docs/api/schema#image-object) for possible values. Uses 'fixed_height' by default
   * */
  giphyVersion: keyof NonNullable<Attachment['giphy']>;

  /**
   * When true, messageList will be scrolled at first unread message, when opened.
   */
  initialScrollToFirstUnreadMessage: boolean;
  /** Order to render the message content */
  messageContentOrder: MessageContentType[];
  removeMessage: (message: { id: string; parent_id?: string }) => Promise<void>;
  /**
   * Override the api request for retry message functionality.
   */
  retrySendMessage: (message: LocalMessage) => Promise<void>;
  sendReaction: (type: string, messageId: string) => Promise<void>;
  updateMessage: (
    updatedMessage: MessageResponse | LocalMessage,
    extraState?: {
      commands?: CommandSuggestion[];
      messageInput?: string;
      threadMessages?: ChannelState['threads'][string];
    },
    throttled?: boolean,
  ) => void;
  /**
   * Provide any additional props for `Pressable` which wraps inner MessageContent component here.
   * Please check docs for Pressable for supported props - https://reactnative.dev/docs/pressable#props
   *
   * @overrideType Object
   */
  additionalPressableProps?: Omit<PressableProps, 'style'>;

  /**
   * Custom handler to handle message swipe action.
   *
   * The default behaviour is swipe to reply for this.
   */
  customMessageSwipeAction?: ({
    channel,
    message,
  }: {
    channel: Channel;
    message: LocalMessage;
  }) => void;

  /**
   * Full override of the delete message button in the Message Actions
   *
   * Please check [cookbook](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#override-or-intercept-message-actions-edit-delete-reaction-reply-etc) for details.
   */
  /** Control if the deleted message is visible to both the send and reciever, either of them or none  */
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;

  disableTypingIndicator?: boolean;
  /**
   * Enable swipe to reply on messages.
   */
  enableSwipeToReply?: boolean;
  /**
   * Whether messages should be aligned to right or left part of screen.
   * By default, messages will be received messages will be aligned to left and
   * sent messages will be aligned to right.
   */
  forceAlignMessages?: Alignment | boolean;

  getMessageGroupStyle?: (params: MessageGroupStylesParams) => GroupStyle[];
  /**
   * Handler to access when a ban user action is invoked.
   * @param message
   */
  handleBan?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a copy message action is invoked */
  handleCopy?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a delete for me message action is invoked */
  handleDeleteForMe?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a delete message action is invoked */
  handleDelete?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when an edit message action is invoked */
  handleEdit?: (message: LocalMessage) => void;
  /** Handler to access when a flag message action is invoked */
  handleFlag?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a mark unread action is invoked */
  handleMarkUnread?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a mute user action is invoked */
  handleMute?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a pin/unpin user action is invoked*/
  handlePinMessage?: ((message: LocalMessage) => MessageActionType) | null;
  /** Handler to access when a quoted reply action is invoked */
  handleQuotedReply?: (message: LocalMessage) => Promise<void>;
  /** Handler to process a reaction */
  handleReaction?: (message: LocalMessage, reactionType: string) => Promise<void>;
  /** Handler to access when a retry action is invoked */
  handleRetry?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a thread reply action is invoked */
  handleThreadReply?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a blocking user action is invoked */
  handleBlockUser?: (user: LocalMessage['user']) => Promise<void>;
  /** A flag specifying whether the poll creation button is available or not. */
  hasCreatePoll?: boolean;
  /** Handler to deal with custom memoization logic of Attachment */
  isAttachmentEqual?: (prevAttachment: Attachment, nextAttachment: Attachment) => boolean;
  /** Object specifying rules defined within simple-markdown https://github.com/Khan/simple-markdown#adding-a-simple-extension */
  markdownRules?: MarkdownRules;
  /**
   * Use this prop to override message actions (which pop-up in message overlay).
   *
   * You can either completely override the default messageActions object.
   *
   * ```
   * <Channel
   *   messageActions=[
   *     {
   *       action: () => { someAction() };
   *       title: "Pin Message";
   *       icon: PinIcon;
   *       titleStyle: {};
   *     },
   *     {
   *       action: () => { someAction() };
   *       title: "Delete Message";
   *       icon: PinIcon;
   *       titleStyle: {};
   *     }
   *   ]
   * >
   * </Channel>
   * ```
   *
   * Or you can selectly keep certain action and remove some:
   *
   * e.g. Lets say you only want to keep threadReply and copyMessage actions
   *
   * ```
   * <Channel
   *   messageActions={({
   *     banUser,
   *     blockUser,
   *     copyMessage,
   *     deleteMessage,
   *     editMessage,
   *     flagMessage,
   *     markUnread,
   *     muteUser,
   *     quotedReply,
   *     retry,
   *     threadReply,
   *   }) => ([
   *     threadReply, copyMessage
   *   ])}
   * >
   *  </Channel>
   *  ```
   *
   * @overrideType Function | Array<Objects>
   */
  messageActions?: (param: MessageActionsParams) => MessageActionType[];

  /**
   * HitSlop for the message swipe to reply gesture
   */
  messageSwipeToReplyHitSlop?: ViewProps['hitSlop'];
  /**
   * The number of lines of the message text to be displayed
   */
  messageTextNumberOfLines?: number;
  /**
   * Theme provided only to messages that are the current users
   */
  myMessageTheme?: DeepPartial<Theme>;
  /**
   * Override default handler for onLongPress on message. You have access to payload of that handler as param:
   *
   * ```
   * <Channel
   *  onLongPressMessage={({
   *    actionHandlers: {
   *        deleteMessage, // () => Promise<void>;
   *        editMessage, // () => void;
   *        quotedReply, // () => void;
   *        resendMessage, // () => Promise<void>;
   *        showMessageOverlay, // () => void;
   *        toggleBanUser, // () => Promise<void>;
   *        toggleMuteUser, // () => Promise<void>;
   *        toggleReaction, // (reactionType: string) => Promise<void>;
   *    },
   *    defaultHandler, // () => void
   *    event, // any event object corresponding to touchable feedback
   *    emitter, // which component trigged this touchable feedback e.g. card, fileAttachment, gallery, message ... etc
   *    message // message object on which longPress occured
   *  }) => {
   *    // Your custom action
   *  }}
   * />
   * ```
   */
  onLongPressMessage?: (payload: MessagePressableHandlerPayload) => void;
  /**
   * Add onPressIn handler for attachments. You have access to payload of that handler as param:
   *
   * ```
   * <Channel
   *  onPressInMessage={({
   *    actionHandlers: {
   *        deleteMessage, // () => Promise<void>;
   *        editMessage, // () => void;
   *        quotedReply, // () => void;
   *        resendMessage, // () => Promise<void>;
   *        showMessageOverlay, // () => void;
   *        toggleBanUser, // () => Promise<void>;
   *        toggleMuteUser, // () => Promise<void>;
   *        toggleReaction, // (reactionType: string) => Promise<void>;
   *    },
   *    defaultHandler, // () => void
   *    event, // any event object corresponding to touchable feedback
   *    emitter, // which component trigged this touchable feedback e.g. card, fileAttachment, gallery, message ... etc
   *    message // message object on which longPress occured
   *  }) => {
   *    // Your custom action
   *  }}
   * />
   * ```
   */
  onPressInMessage?: (payload: MessagePressableHandlerPayload) => void;
  /**
   * Override onPress handler for message. You have access to payload of that handler as param:
   *
   * ```
   * <Channel
   *  onPressMessage={({
   *    actionHandlers: {
   *        deleteMessage, // () => Promise<void>;
   *        editMessage, // () => void;
   *        quotedReply, // () => void;
   *        resendMessage, // () => Promise<void>;
   *        showMessageOverlay, // () => void;
   *        toggleBanUser, // () => Promise<void>;
   *        toggleMuteUser, // () => Promise<void>;
   *        toggleReaction, // (reactionType: string) => Promise<void>;
   *    },
   *    defaultHandler, // () => void
   *    event, // any event object corresponding to touchable feedback
   *    emitter, // which component trigged this touchable feedback e.g. card, fileAttachment, gallery, message ... etc
   *    message // message object on which longPress occurred
   *  }) => {
   *    // Your custom action
   *  }}
   * />
   * ```
   */
  onPressMessage?: (payload: MessagePressableHandlerPayload) => void;
  quotedMessage?: LocalMessage | null;
  /**
   * The position of the reaction list in the message
   */
  reactionListPosition?: 'top' | 'bottom';

  /**
   * The alignment of the reaction list
   */
  reactionListType?: 'clustered' | 'segmented';

  /**
   * Full override of the reaction function on Message and Message Overlay
   *
   * Please check [cookbook](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#override-or-intercept-message-actions-edit-delete-reaction-reply-etc) for details.
   * */
  selectReaction?: (message: LocalMessage) => (reactionType: string) => Promise<void>;

  /**
   * Boolean to enable/disable the message underlay background when there are unread messages in the Message List.
   */
  shouldShowUnreadUnderlay?: boolean;
  /**
   * The supported reactions that the user can use to react to messages.
   */
  supportedReactions?: ReactionData[];

  targetedMessage?: string;
};

export const MessagesContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessagesContextValue,
);

export const MessagesProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: MessagesContextValue;
}>) => (
  <MessagesContext.Provider value={value as unknown as MessagesContextValue}>
    {children}
  </MessagesContext.Provider>
);

export const useMessagesContext = () => {
  const contextValue = useContext(MessagesContext) as unknown as MessagesContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessagesContext hook was called outside of the MessagesContext provider. Make sure you have configured MessageList component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#message-list',
    );
  }

  return contextValue;
};
