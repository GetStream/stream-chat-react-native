import React, { PropsWithChildren, useContext } from 'react';

import type { TouchableOpacityProps } from 'react-native';

import type { ImageLoadingFailedIndicatorProps } from 'src/components/Attachment/ImageLoadingFailedIndicator';
import type { ImageLoadingIndicatorProps } from 'src/components/Attachment/ImageLoadingIndicator';

import type { MessagePinnedHeaderProps } from 'src/components/Message/MessageSimple/MessagePinnedHeader';

import type { Attachment, ChannelState, MessageResponse } from 'stream-chat';

import type { AttachmentProps } from '../../components/Attachment/Attachment';
import type { AttachmentActionsProps } from '../../components/Attachment/AttachmentActions';
import type { AudioAttachmentProps } from '../../components/Attachment/AudioAttachment';
import type { CardProps } from '../../components/Attachment/Card';
import type { FileAttachmentProps } from '../../components/Attachment/FileAttachment';
import type { FileAttachmentGroupProps } from '../../components/Attachment/FileAttachmentGroup';
import type { FileIconProps } from '../../components/Attachment/FileIcon';
import type { GalleryProps } from '../../components/Attachment/Gallery';
import type { GiphyProps } from '../../components/Attachment/Giphy';
import type { VideoThumbnailProps } from '../../components/Attachment/VideoThumbnail';
import type {
  MessageProps,
  MessageTouchableHandlerPayload,
} from '../../components/Message/Message';
import type { MessageAvatarProps } from '../../components/Message/MessageSimple/MessageAvatar';
import type { MessageContentProps } from '../../components/Message/MessageSimple/MessageContent';
import type { MessageDeletedProps } from '../../components/Message/MessageSimple/MessageDeleted';
import type { MessageFooterProps } from '../../components/Message/MessageSimple/MessageFooter';

import type { MessageRepliesProps } from '../../components/Message/MessageSimple/MessageReplies';
import type { MessageRepliesAvatarsProps } from '../../components/Message/MessageSimple/MessageRepliesAvatars';
import type { MessageSimpleProps } from '../../components/Message/MessageSimple/MessageSimple';
import type { MessageStatusProps } from '../../components/Message/MessageSimple/MessageStatus';
import type { MessageTextProps } from '../../components/Message/MessageSimple/MessageTextContainer';
import type { ReactionListProps } from '../../components/Message/MessageSimple/ReactionList';
import type { MarkdownRules } from '../../components/Message/MessageSimple/utils/renderText';
import type { MessageActionsParams } from '../../components/Message/utils/messageActions';
import type { DateHeaderProps } from '../../components/MessageList/DateHeader';
import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { InlineDateSeparatorProps } from '../../components/MessageList/InlineDateSeparator';
import type { MessageListProps } from '../../components/MessageList/MessageList';
import type { MessageSystemProps } from '../../components/MessageList/MessageSystem';
import type { ScrollToBottomButtonProps } from '../../components/MessageList/ScrollToBottomButton';
import type { getGroupStyles } from '../../components/MessageList/utils/getGroupStyles';
import type { MessageActionType } from '../../components/MessageOverlay/MessageActionListItem';
import type { OverlayReactionListProps } from '../../components/MessageOverlay/OverlayReactionList';
import type { ReplyProps } from '../../components/Reply/Reply';
import type { FlatList } from '../../native';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import type { ReactionData } from '../../utils/utils';
import type { Alignment } from '../messageContext/MessageContext';
import type { SuggestionCommand } from '../suggestionsContext/SuggestionsContext';
import type { DeepPartial } from '../themeContext/ThemeContext';
import type { Theme } from '../themeContext/utils/theme';
import type { TDateTimeParserInput } from '../translationContext/TranslationContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageContentType = 'attachments' | 'files' | 'gallery' | 'quoted_reply' | 'text';
export type DeletedMessagesVisibilityType = 'always' | 'never' | 'receiver' | 'sender';

export type MessagesContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  addReaction: (type: string, messageId: string) => void;
  /**
   * UI component for Attachment.
   * Defaults to: [Attachment](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Attachment.tsx)
   */
  Attachment: React.ComponentType<AttachmentProps<StreamChatGenerics>>;
  /**
   * UI component to display AttachmentActions. e.g., send, shuffle, cancel in case of giphy
   * Defaults to: [AttachmentActions](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/AttachmentActions.tsx)
   */
  AttachmentActions: React.ComponentType<AttachmentActionsProps<StreamChatGenerics>>;
  /** Custom UI component for AudioAttachment. */
  AudioAttachment: React.ComponentType<AudioAttachmentProps>;
  /**
   * UI component to display generic media type e.g. giphy, url preview etc
   * Defaults to: [Card](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Card.tsx)
   */
  Card: React.ComponentType<CardProps<StreamChatGenerics>>;
  /**
   * UI component for DateHeader
   * Defaults to: [DateHeader](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageList/DateHeader.tsx)
   **/
  DateHeader: React.ComponentType<DateHeaderProps>;
  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch: boolean;

  enableMessageGroupingByUser: boolean;

  /**
   * UI component to display File type attachment.
   * Defaults to: [FileAttachment](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/FileAttachment.tsx)
   */
  FileAttachment: React.ComponentType<FileAttachmentProps<StreamChatGenerics>>;

  /**
   * UI component to display group of File type attachments or multiple file attachments (in single message).
   * Defaults to: [FileAttachmentGroup](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/FileAttachmentGroup.tsx)
   */
  FileAttachmentGroup: React.ComponentType<FileAttachmentGroupProps<StreamChatGenerics>>;
  /**
   * UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/FileIcon.tsx
   */
  FileAttachmentIcon: React.ComponentType<FileIconProps>;
  FlatList: typeof FlatList;
  /**
   * UI component to display image attachments
   * Defaults to: [Gallery](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Gallery.tsx)
   */
  Gallery: React.ComponentType<GalleryProps<StreamChatGenerics>>;
  /**
   * UI component for Giphy
   * Defaults to: [Giphy](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Giphy.tsx)
   */
  Giphy: React.ComponentType<GiphyProps<StreamChatGenerics>>;
  /**
   * The giphy version to render - check the keys of the [Image Object](https://developers.giphy.com/docs/api/schema#image-object) for possible values. Uses 'fixed_height' by default
   * */
  giphyVersion: keyof NonNullable<Attachment['giphy']>;
  /**
   * The indicator rendered when loading an image fails.
   */
  ImageLoadingFailedIndicator: React.ComponentType<ImageLoadingFailedIndicatorProps>;

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
  Message: React.ComponentType<MessageProps<StreamChatGenerics>>;

  /**
   * UI component for MessageAvatar
   * Defaults to: [MessageAvatar](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageAvatar.tsx)
   **/
  MessageAvatar: React.ComponentType<MessageAvatarProps<StreamChatGenerics>>;
  /**
   * UI component for MessageContent
   * Defaults to: [MessageContent](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageContent.tsx)
   */
  MessageContent: React.ComponentType<MessageContentProps<StreamChatGenerics>>;
  /** Order to render the message content */
  messageContentOrder: MessageContentType[];
  /**
   * UI component for MessageDeleted
   * Defaults to: [MessageDeleted](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageSimple/MessageDeleted.tsx)
   */
  MessageDeleted: React.ComponentType<MessageDeletedProps<StreamChatGenerics>>;
  /**
   * Custom message footer component
   */
  MessageFooter: React.ComponentType<MessageFooterProps<StreamChatGenerics>>;
  MessageList: React.ComponentType<MessageListProps<StreamChatGenerics>>;
  /**
   * Custom message pinned component
   */
  MessagePinnedHeader: React.ComponentType<MessagePinnedHeaderProps<StreamChatGenerics>>;
  /**
   * UI component for MessageReplies
   * Defaults to: [MessageReplies](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageSimple/MessageReplies.tsx)
   */
  MessageReplies: React.ComponentType<MessageRepliesProps<StreamChatGenerics>>;

  /**
   * UI Component for MessageRepliesAvatars
   * Defaults to: [MessageRepliesAvatars](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/MessageSimple/MessageRepliesAvatars.tsx)
   */
  MessageRepliesAvatars: React.ComponentType<MessageRepliesAvatarsProps<StreamChatGenerics>>;
  /**
   * UI component for MessageSimple
   * Defaults to: [MessageSimple](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageSimple.tsx)
   */
  MessageSimple: React.ComponentType<MessageSimpleProps<StreamChatGenerics>>;
  /**
   * UI component for MessageStatus (delivered/read)
   * Defaults to: [MessageStatus](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Message/MessageSimple/MessageStatus.tsx)
   */
  MessageStatus: React.ComponentType<MessageStatusProps<StreamChatGenerics>>;
  /**
   * UI component for MessageSystem
   * Defaults to: [MessageSystem](https://getstream.io/chat/docs/sdk/reactnative/ui-components/message-system/)
   */
  MessageSystem: React.ComponentType<MessageSystemProps<StreamChatGenerics>>;
  /**
   * UI component for OverlayReactionList
   */
  OverlayReactionList: React.ComponentType<OverlayReactionListProps<StreamChatGenerics>>;
  /**
   * UI component for ReactionList
   * Defaults to: [ReactionList](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Reaction/ReactionList.tsx)
   */
  ReactionList: React.ComponentType<ReactionListProps<StreamChatGenerics>>;
  removeMessage: (message: { id: string; parent_id?: string }) => void;
  removeReaction: (type: string, messageId: string) => void;
  /**
   * UI component for Reply
   * Defaults to: [Reply](https://getstream.io/chat/docs/sdk/reactnative/ui-components/reply/)
   */
  Reply: React.ComponentType<ReplyProps<StreamChatGenerics>>;
  /**
   * Override the api request for retry message functionality.
   */
  retrySendMessage: (message: MessageResponse<StreamChatGenerics>) => Promise<void>;
  /**
   * UI component for ScrollToBottomButton
   * Defaults to: [ScrollToBottomButton](https://getstream.io/chat/docs/sdk/reactnative/ui-components/scroll-to-bottom-button/)
   */
  ScrollToBottomButton: React.ComponentType<ScrollToBottomButtonProps>;
  setEditingState: (message: MessageType<StreamChatGenerics>) => void;
  setQuotedMessageState: (message: MessageType<StreamChatGenerics>) => void;
  supportedReactions: ReactionData[];
  /**
   * UI component for TypingIndicator
   * Defaults to: [TypingIndicator](https://getstream.io/chat/docs/sdk/reactnative/ui-components/typing-indicator/)
   */
  TypingIndicator: React.ComponentType;
  /**
   * UI component for TypingIndicatorContainer
   * Defaults to: [TypingIndicatorContainer](https://getstream.io/chat/docs/sdk/reactnative/contexts/messages-context/#typingindicatorcontainer)
   */
  TypingIndicatorContainer: React.ComponentType;
  updateMessage: (
    updatedMessage: MessageResponse<StreamChatGenerics>,
    extraState?: {
      commands?: SuggestionCommand<StreamChatGenerics>[];
      messageInput?: string;
      threadMessages?: ChannelState<StreamChatGenerics>['threads'][string];
    },
  ) => void;
  /**
   * Custom UI component to display enriched url preview.
   * Defaults to https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/Attachment/Card.tsx
   */
  UrlPreview: React.ComponentType<CardProps<StreamChatGenerics>>;
  VideoThumbnail: React.ComponentType<VideoThumbnailProps>;
  /**
   * Provide any additional props for `TouchableOpacity` which wraps inner MessageContent component here.
   * Please check docs for TouchableOpacity for supported props - https://reactnative.dev/docs/touchableopacity#props
   *
   * @overrideType Object
   */
  additionalTouchableProps?: Omit<TouchableOpacityProps, 'style'>;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover?: React.ComponentType<CardProps<StreamChatGenerics>>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter?: React.ComponentType<CardProps<StreamChatGenerics>>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader?: React.ComponentType<CardProps<StreamChatGenerics>>;

  /**
   * Full override of the delete message button in the Message Actions
   *
   * Please check [cookbook](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#override-or-intercept-message-actions-edit-delete-reaction-reply-etc) for details.
   */

  /** Control if the deleted message is visible to both the send and reciever, either of them or none  */
  deletedMessagesVisibilityType?: DeletedMessagesVisibilityType;

  disableTypingIndicator?: boolean;

  /**
   * Whether messages should be aligned to right or left part of screen.
   * By default, messages will be received messages will be aligned to left and
   * sent messages will be aligned to right.
   */
  forceAlignMessages?: Alignment | boolean;
  /**
   * Optional function to custom format the message date
   */
  formatDate?: (date: TDateTimeParserInput) => string;
  getMessagesGroupStyles?: typeof getGroupStyles;
  handleBlock?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to access when a copy message action is invoked */
  handleCopy?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to access when a delete message action is invoked */
  handleDelete?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to access when an edit message action is invoked */
  handleEdit?: (message: MessageType<StreamChatGenerics>) => void;
  /** Handler to access when a flag message action is invoked */
  handleFlag?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to access when a mute user action is invoked */
  handleMute?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to access when a pin/unpin user action is invoked*/
  handlePinMessage?: ((message: MessageType<StreamChatGenerics>) => MessageActionType) | null;
  /** Handler to access when a quoted reply action is invoked */
  handleQuotedReply?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to process a reaction */
  handleReaction?: (
    message: MessageType<StreamChatGenerics>,
    reactionType: string,
  ) => Promise<void>;
  /** Handler to access when a retry action is invoked */
  handleRetry?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to access when a thread reply action is invoked */
  handleThreadReply?: (message: MessageType<StreamChatGenerics>) => Promise<void>;
  /** Handler to deal with custom memoization logic of Attachment */
  isAttachmentEqual?: (
    prevAttachment: Attachment<StreamChatGenerics>,
    nextAttachment: Attachment<StreamChatGenerics>,
  ) => boolean;
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
   *     blockUser,
   *     copyMessage,
   *     deleteMessage,
   *     editMessage,
   *     flagMessage,
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
  messageActions?: (param: MessageActionsParams<StreamChatGenerics>) => MessageActionType[];
  /**
   * Custom message header component
   */
  MessageHeader?: React.ComponentType<MessageFooterProps<StreamChatGenerics>>;
  /** Custom UI component for message text */
  MessageText?: React.ComponentType<MessageTextProps<StreamChatGenerics>>;

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
  onLongPressMessage?: (payload: MessageTouchableHandlerPayload<StreamChatGenerics>) => void;
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
  onPressInMessage?: (payload: MessageTouchableHandlerPayload<StreamChatGenerics>) => void;
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
  onPressMessage?: (payload: MessageTouchableHandlerPayload<StreamChatGenerics>) => void;

  /**
   * Full override of the reaction function on Message and Message Overlay
   *
   * Please check [cookbook](https://github.com/GetStream/stream-chat-react-native/wiki/Cookbook-v3.0#override-or-intercept-message-actions-edit-delete-reaction-reply-etc) for details.
   * */
  selectReaction?: (
    message: MessageType<StreamChatGenerics>,
  ) => (reactionType: string) => Promise<void>;

  targetedMessage?: string;
};

export const MessagesContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessagesContextValue,
);

export const MessagesProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value?: MessagesContextValue<StreamChatGenerics>;
}>) => (
  <MessagesContext.Provider value={value as unknown as MessagesContextValue}>
    {children}
  </MessagesContext.Provider>
);

export const useMessagesContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    MessagesContext,
  ) as unknown as MessagesContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useMessagesContext hook was called outside of the MessagesContext provider. Make sure you have configured MessageList component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#message-list`,
    );
  }

  return contextValue;
};

/**
 * Typescript currently does not support partial inference so if MessagesContext
 * typing is desired while using the HOC withMessagesContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withMessagesContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof MessagesContextValue<StreamChatGenerics>>> => {
  const WithMessagesContextComponent = (
    props: Omit<P, keyof MessagesContextValue<StreamChatGenerics>>,
  ) => {
    const messagesContext = useMessagesContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...messagesContext} />;
  };
  WithMessagesContextComponent.displayName = `WithMessagesContext${getDisplayName(Component)}`;
  return WithMessagesContextComponent;
};
