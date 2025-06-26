import React, { PropsWithChildren, useContext } from 'react';

import { PressableProps, ViewProps } from 'react-native';

import type {
  Attachment,
  ChannelState,
  CommandSuggestion,
  LocalMessage,
  MessageResponse,
} from 'stream-chat';

import type { PollContentProps, StreamingMessageViewProps } from '../../components';
import type { AttachmentProps } from '../../components/Attachment/Attachment';
import type { AttachmentActionsProps } from '../../components/Attachment/AttachmentActions';
import type { AudioAttachmentProps } from '../../components/Attachment/AudioAttachment';
import type { CardProps } from '../../components/Attachment/Card';
import type { FileAttachmentProps } from '../../components/Attachment/FileAttachment';
import type { FileAttachmentGroupProps } from '../../components/Attachment/FileAttachmentGroup';
import type { FileIconProps } from '../../components/Attachment/FileIcon';
import type { GalleryProps } from '../../components/Attachment/Gallery';
import type { GiphyProps } from '../../components/Attachment/Giphy';
import type { ImageLoadingFailedIndicatorProps } from '../../components/Attachment/ImageLoadingFailedIndicator';
import type { ImageLoadingIndicatorProps } from '../../components/Attachment/ImageLoadingIndicator';
import { ImageReloadIndicatorProps } from '../../components/Attachment/ImageReloadIndicator';
import type { VideoThumbnailProps } from '../../components/Attachment/VideoThumbnail';
import type {
  MessagePressableHandlerPayload,
  MessageProps,
} from '../../components/Message/Message';
import type { MessageAvatarProps } from '../../components/Message/MessageSimple/MessageAvatar';
import type { MessageBounceProps } from '../../components/Message/MessageSimple/MessageBounce';
import type { MessageContentProps } from '../../components/Message/MessageSimple/MessageContent';
import type { MessageDeletedProps } from '../../components/Message/MessageSimple/MessageDeleted';
import type { MessageEditedTimestampProps } from '../../components/Message/MessageSimple/MessageEditedTimestamp';
import type { MessageErrorProps } from '../../components/Message/MessageSimple/MessageError';
import type { MessageFooterProps } from '../../components/Message/MessageSimple/MessageFooter';
import type { MessagePinnedHeaderProps } from '../../components/Message/MessageSimple/MessagePinnedHeader';
import type { MessageRepliesProps } from '../../components/Message/MessageSimple/MessageReplies';
import type { MessageRepliesAvatarsProps } from '../../components/Message/MessageSimple/MessageRepliesAvatars';
import type { MessageSimpleProps } from '../../components/Message/MessageSimple/MessageSimple';
import type { MessageStatusProps } from '../../components/Message/MessageSimple/MessageStatus';
import type { MessageTextProps } from '../../components/Message/MessageSimple/MessageTextContainer';
import { MessageTimestampProps } from '../../components/Message/MessageSimple/MessageTimestamp';
import { ReactionListBottomProps } from '../../components/Message/MessageSimple/ReactionList/ReactionListBottom';
import type { ReactionListTopProps } from '../../components/Message/MessageSimple/ReactionList/ReactionListTop';
import type { MarkdownRules } from '../../components/Message/MessageSimple/utils/renderText';
import type { MessageActionsParams } from '../../components/Message/utils/messageActions';
import type { DateHeaderProps } from '../../components/MessageList/DateHeader';
import type { InlineDateSeparatorProps } from '../../components/MessageList/InlineDateSeparator';
import type { MessageListProps } from '../../components/MessageList/MessageList';
import type { MessageSystemProps } from '../../components/MessageList/MessageSystem';
import type { ScrollToBottomButtonProps } from '../../components/MessageList/ScrollToBottomButton';
import { TypingIndicatorContainerProps } from '../../components/MessageList/TypingIndicatorContainer';
import { UnreadMessagesNotificationProps } from '../../components/MessageList/UnreadMessagesNotification';
import type { getGroupStyles } from '../../components/MessageList/utils/getGroupStyles';
import { MessageActionListProps } from '../../components/MessageMenu/MessageActionList';
import type {
  MessageActionListItemProps,
  MessageActionType,
} from '../../components/MessageMenu/MessageActionListItem';
import { MessageMenuProps } from '../../components/MessageMenu/MessageMenu';
import type { MessageReactionPickerProps } from '../../components/MessageMenu/MessageReactionPicker';
import { MessageUserReactionsProps } from '../../components/MessageMenu/MessageUserReactions';
import { MessageUserReactionsAvatarProps } from '../../components/MessageMenu/MessageUserReactionsAvatar';
import { MessageUserReactionsItemProps } from '../../components/MessageMenu/MessageUserReactionsItem';
import type { ReplyProps } from '../../components/Reply/Reply';
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
  | 'text';
export type DeletedMessagesVisibilityType = 'always' | 'never' | 'receiver' | 'sender';

export type MessagesContextValue = Pick<MessageContextValue, 'isMessageAIGenerated'> & {
  /**
   * UI component for Attachment.
   * Defaults to: [Attachment](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Attachment.tsx)
   */
  Attachment: React.ComponentType<AttachmentProps>;
  /**
   * UI component to display AttachmentActions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to: [AttachmentActions](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/AttachmentActions.tsx)
   */
  AttachmentActions: React.ComponentType<AttachmentActionsProps>;
  /** Custom UI component for AudioAttachment. */
  AudioAttachment: React.ComponentType<AudioAttachmentProps>;
  /**
   * UI component to display generic media type e.g. giphy, url preview etc
   * Defaults to: [Card](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Card.tsx)
   */
  Card: React.ComponentType<CardProps>;
  /**
   * UI component for DateHeader
   * Defaults to: [DateHeader](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageList/DateHeader.tsx)
   **/
  DateHeader: React.ComponentType<DateHeaderProps>;
  deleteMessage: (message: LocalMessage, hardDelete?: boolean) => Promise<void>;
  deleteReaction: (type: string, messageId: string) => Promise<void>;

  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch: boolean;

  enableMessageGroupingByUser: boolean;

  /**
   * UI component to display File type attachment.
   * Defaults to: [FileAttachment](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/FileAttachment.tsx)
   */
  FileAttachment: React.ComponentType<FileAttachmentProps>;
  /**
   * UI component to display group of File type attachments or multiple file attachments (in single message).
   * Defaults to: [FileAttachmentGroup](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/FileAttachmentGroup.tsx)
   */
  FileAttachmentGroup: React.ComponentType<FileAttachmentGroupProps>;
  /**
   * UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/FileIcon.tsx
   */
  FileAttachmentIcon: React.ComponentType<FileIconProps>;
  FlatList: typeof NativeHandlers.FlatList | undefined;
  /**
   * UI component to display image attachments
   * Defaults to: [Gallery](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Gallery.tsx)
   */
  Gallery: React.ComponentType<GalleryProps>;
  /**
   * UI component for Giphy
   * Defaults to: [Giphy](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Giphy.tsx)
   */
  Giphy: React.ComponentType<GiphyProps>;
  /**
   * The giphy version to render - check the keys of the [Image Object](https://developers.giphy.com/docs/api/schema#image-object) for possible values. Uses 'fixed_height' by default
   * */
  giphyVersion: keyof NonNullable<Attachment['giphy']>;

  /**
   * The indicator rendered when loading an image fails.
   */
  ImageLoadingFailedIndicator: React.ComponentType<ImageLoadingFailedIndicatorProps>;

  /**
   * The indicator rendered at the center of an image whenever its loading fails, used to trigger retries.
   */
  ImageReloadIndicator: React.ComponentType<ImageReloadIndicatorProps>;

  /**
   * The indicator rendered when image is loading. By default renders <ActivityIndicator/>
   */
  ImageLoadingIndicator: React.ComponentType<ImageLoadingIndicatorProps>;

  /**
   * When true, messageList will be scrolled at first unread message, when opened.
   */
  initialScrollToFirstUnreadMessage: boolean;
  /**
   * UI component for Message Date Separator Component
   * Defaults to: [InlineDateSeparator](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageList/InlineDateSeparator.tsx)
   */
  InlineDateSeparator: React.ComponentType<InlineDateSeparatorProps>;
  /**
   * UI component for InlineUnreadIndicator
   * Defaults to: [InlineUnreadIndicator](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/InlineUnreadIndicator.tsx)
   **/
  InlineUnreadIndicator: React.ComponentType;

  Message: React.ComponentType<MessageProps>;
  /**
   * Custom UI component for rendering Message actions in message menu.
   *
   * **Default** [MessageActionList](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageMenu/MessageActionList.tsx)
   */
  MessageActionList: React.ComponentType<MessageActionListProps>;
  /**
   * Custom UI component for rendering Message action item in message menu.
   *
   * **Default** [MessageActionList](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageMenu/MessageActionList.tsx)
   */
  MessageActionListItem: React.ComponentType<MessageActionListItemProps>;
  /**
   * UI component for MessageAvatar
   * Defaults to: [MessageAvatar](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageAvatar.tsx)
   **/
  MessageAvatar: React.ComponentType<MessageAvatarProps>;
  /**
   * UI Component for MessageBounce
   */
  MessageBounce: React.ComponentType<MessageBounceProps>;
  /**
   * UI component for MessageContent
   * Defaults to: [MessageContent](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageContent.tsx)
   */
  MessageContent: React.ComponentType<MessageContentProps>;
  /** Order to render the message content */
  messageContentOrder: MessageContentType[];
  /**
   * UI component for MessageDeleted
   * Defaults to: [MessageDeleted](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageSimple/MessageDeleted.tsx)
   */
  MessageDeleted: React.ComponentType<MessageDeletedProps>;
  /**
   * UI component for MessageEditedTimestamp
   * Defaults to: [MessageEditedTimestamp](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageSimple/MessageEditedTimestamp.tsx)
   */
  MessageEditedTimestamp: React.ComponentType<MessageEditedTimestampProps>;
  /**
   * UI component for the MessageError.
   */
  MessageError: React.ComponentType<MessageErrorProps>;
  /**
   * Custom message footer component
   */
  MessageFooter: React.ComponentType<MessageFooterProps>;
  MessageList: React.ComponentType<MessageListProps>;
  /**
   * UI component for MessageMenu
   */
  MessageMenu: React.ComponentType<MessageMenuProps>;
  /**
   * Custom message pinned component
   */
  MessagePinnedHeader: React.ComponentType<MessagePinnedHeaderProps>;
  /**
   * UI component for MessageReactionPicker
   */
  MessageReactionPicker: React.ComponentType<MessageReactionPickerProps>;
  /**
   * UI component for MessageReplies
   * Defaults to: [MessageReplies](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageSimple/MessageReplies.tsx)
   */
  MessageReplies: React.ComponentType<MessageRepliesProps>;
  /**
   * UI Component for MessageRepliesAvatars
   * Defaults to: [MessageRepliesAvatars](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageSimple/MessageRepliesAvatars.tsx)
   */
  MessageRepliesAvatars: React.ComponentType<MessageRepliesAvatarsProps>;
  /**
   * UI component for MessageSimple
   * Defaults to: [MessageSimple](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageSimple.tsx)
   */
  MessageSimple: React.ComponentType<MessageSimpleProps>;
  /**
   * UI component for MessageStatus (delivered/read)
   * Defaults to: [MessageStatus](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageStatus.tsx)
   */
  MessageStatus: React.ComponentType<MessageStatusProps>;
  /**
   * UI component for MessageSystem
   * Defaults to: [MessageSystem](https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-system/)
   */
  MessageSystem: React.ComponentType<MessageSystemProps>;
  /**
   * UI component for MessageTimestamp
   * Defaults to: [MessageTimestamp](https://github.com/GetStream/stream-chat-react-native/blob/develop/package/src/components/Message/MessageSimple/MessageTimestamp.tsx)
   */
  MessageTimestamp: React.ComponentType<MessageTimestampProps>;
  /**
   * Custom UI component for rendering user reactions, in message menu.
   *
   * **Default** [MessageUserReactions](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageMenu/MessageUserReactions.tsx)
   */
  MessageUserReactions: React.ComponentType<MessageUserReactionsProps>;
  /**
   * Custom UI component for rendering user reactions avatar under `MessageUserReactionsItem`, in message menu.
   *
   * **Default** [MessageUserReactionsAvatar](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageMenu/MessageUserReactionsAvatar.tsx)
   */
  MessageUserReactionsAvatar: React.ComponentType<MessageUserReactionsAvatarProps>;
  /**
   * Custom UI component for rendering individual user reactions item under `MessageUserReactions`, in message menu.
   *
   * **Default** [MessageUserReactionsItem](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageMenu/MessageUserReactionsItem.tsx)
   */
  MessageUserReactionsItem: React.ComponentType<MessageUserReactionsItemProps>;

  removeMessage: (message: { id: string; parent_id?: string }) => Promise<void>;
  /**
   * UI component for Reply
   * Defaults to: [Reply](https://getstream.io/chat/docs/sdk/reactnative/ui-components/reply/)
   */
  Reply: React.ComponentType<ReplyProps>;
  /**
   * Override the api request for retry message functionality.
   */
  retrySendMessage: (message: LocalMessage) => Promise<void>;
  /**
   * UI component for ScrollToBottomButton
   * Defaults to: [ScrollToBottomButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/scroll-to-bottom-button/)
   */
  ScrollToBottomButton: React.ComponentType<ScrollToBottomButtonProps>;
  sendReaction: (type: string, messageId: string) => Promise<void>;
  /**
   * UI component for StreamingMessageView. Displays the text of a message with a typewriter animation.
   */
  StreamingMessageView: React.ComponentType<StreamingMessageViewProps>;
  /**
   * UI component for TypingIndicator
   * Defaults to: [TypingIndicator](https://getstream.io/chat/docs/sdk/reactnative/ui-components/typing-indicator/)
   */
  TypingIndicator: React.ComponentType;
  /**
   * UI component for TypingIndicatorContainer
   * Defaults to: [TypingIndicatorContainer](https://getstream.io/chat/docs/sdk/reactnative/contexts/messages-context/#typingindicatorcontainer)
   */
  TypingIndicatorContainer: React.ComponentType<TypingIndicatorContainerProps>;
  UnreadMessagesNotification: React.ComponentType<UnreadMessagesNotificationProps>;
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
   * Custom UI component to display enriched url preview.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Card.tsx
   */
  UrlPreview: React.ComponentType<CardProps>;
  VideoThumbnail: React.ComponentType<VideoThumbnailProps>;
  /**
   * Provide any additional props for `Pressable` which wraps inner MessageContent component here.
   * Please check docs for Pressable for supported props - https://reactnative.dev/docs/pressable#props
   *
   * @overrideType Object
   */
  additionalPressableProps?: Omit<PressableProps, 'style'>;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover?: React.ComponentType<CardProps>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter?: React.ComponentType<CardProps>;

  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader?: React.ComponentType<CardProps>;

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

  getMessagesGroupStyles?: typeof getGroupStyles;
  /**
   * Handler to access when a ban user action is invoked.
   * @param message
   */
  handleBan?: (message: LocalMessage) => Promise<void>;
  /** Handler to access when a copy message action is invoked */
  handleCopy?: (message: LocalMessage) => Promise<void>;
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
  /** A flag specifying whether the poll creation button is available or not. */
  hasCreatePoll?: boolean;
  /** Handler to deal with custom memoization logic of Attachment */
  isAttachmentEqual?: (prevAttachment: Attachment, nextAttachment: Attachment) => boolean;
  legacyImageViewerSwipeBehaviour?: boolean;
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
   * Custom message header component
   */
  MessageHeader?: React.ComponentType<MessageFooterProps>;
  MessageSwipeContent?: React.ComponentType;
  /**
   * HitSlop for the message swipe to reply gesture
   */
  messageSwipeToReplyHitSlop?: ViewProps['hitSlop'];
  /** Custom UI component for message text */
  MessageText?: React.ComponentType<MessageTextProps>;
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
  /**
   * Override the entire content of the Poll component. The component has full access to the
   * usePollState() and usePollContext() hooks.
   * */
  PollContent?: React.ComponentType<PollContentProps>;
  quotedMessage?: LocalMessage | null;
  /**
   * UI component for ReactionListTop
   * Defaults to: [ReactionList](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Reaction/ReactionList.tsx)
   */
  ReactionListBottom?: React.ComponentType<ReactionListBottomProps>;
  /**
   * The position of the reaction list in the message
   */
  reactionListPosition?: 'top' | 'bottom';

  /**
   * UI component for ReactionListTop
   * Defaults to: [ReactionList](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Reaction/ReactionList.tsx)
   */
  ReactionListTop?: React.ComponentType<ReactionListTopProps>;

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
