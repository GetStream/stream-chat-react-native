// TypeScript Version: 2.8

import * as React from 'react';
import { Text, GestureResponderEvent } from 'react-native';
import * as Client from 'stream-chat';
import * as SeamlessImmutable from 'seamless-immutable';

//================================================================================================
//================================================================================================
//
//                                Context types
//
//================================================================================================
//================================================================================================
declare function withChatContext(): React.FC;
export interface ChatContext extends React.Context<ChatContextValue> {}
export interface ChatContextValue {
  client?: Client.StreamChat;
  channel?: Client.Channel;
  setActiveChannel?(
    channel: Client.Channel,
    event?: GestureResponderEvent,
  ): void;
  isOnline?: boolean;
  connectionRecovering?: boolean;
}

declare function withSuggestionsContext(): React.FC;
export interface SuggestionsContext
  extends React.Context<SuggestionsContextValue> {}
export interface SuggestionsContextValue {
  setInputBoxContainerRef?(ref: any): void;
  openSuggestions?(title: string, component: React.ElementType): void;
  closeSuggestions?(): void;
  // Example of suggestion object:
  //
  //     {
  //         data: [
  //             'suggestion 1',
  //             'suggestion 2',
  //             'suggestion 3',
  //             ...
  //         ],
  //         onSelect: (suggestionItem) => { ... },
  //     }
  // ```
  updateSuggestions?(suggestions: Array<object>): void;
}

declare function withChannelContext(): React.FC;
export interface ChannelContext extends React.Context<ChannelContextValue> {}
export interface ChannelContextValue {
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentProps>;
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  messages?: Client.MessageResponse[];
  online?: boolean;
  // TODO: Create proper type for typing object
  typing?: SeamlessImmutable.Immutable<{
    [user_id: string]: Client.Event<Client.TypingStartEvent>;
  }>;
  watcher_count?: number;
  watchers?: SeamlessImmutable.Immutable<{
    [user_id: string]: SeamlessImmutable.Immutable<Client.UserResponse>;
  }>;
  members?: SeamlessImmutable.Immutable<{
    [user_id: string]: SeamlessImmutable.Immutable<
      Client.ChannelMemberResponse
    >;
  }>;
  read?: SeamlessImmutable.Immutable<{
    [user_id: string]: SeamlessImmutable.Immutable<{
      last_read: string;
      user: Client.UserResponse;
    }>;
  }>;
  error?: boolean;
  // Loading the intial content of the channel
  loading?: boolean;
  // Loading more messages
  loadingMore?: boolean;
  hasMore?: boolean;
  threadMessages?: Client.MessageResponse[];
  threadLoadingMore?: boolean;
  threadHasMore?: boolean;
  kavEnabled?: boolean;

  sendMessage?(message: Client.Message): void;
  /** The function to update a message, handled by the Channel component */
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState?: object,
  ): void;
  editMessage?(message: Client.Message): void | Promise<Client.MessageResponse>;
  retrySendMessage?(message: Client.Message): void;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  setEditingState?(message: Client.Message): void;
  /** Function executed when user clicks on link to open thread */
  openThread?(message: Client.Message, event: React.SyntheticEvent): void;
  markRead?(): void;

  loadMore?(): void;
  // thread related
  loadMoreThread?(): void;
  closeThread?(): void;
  clearEditingState?(): void;
}

export interface KeyboardContext extends React.Context<KeyboardContextValue> {}
export interface KeyboardContextValue {
  dismissKeyboard?(): void;
}

export interface MessageContentContext
  extends React.Context<MessageContentContextValue> {}
export interface MessageContentContextValue {
  onLongPress?: (event: GestureResponderEvent) => void;
}

//================================================================================================
//================================================================================================
//
//                                Props types
//
//================================================================================================
//================================================================================================
export interface ChatProps {
  /** The StreamChat client object */
  client: Client.StreamChat;
  /**
   * Theme object
   *
   * @ref https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
   * */
  style?: object;
}

export interface ChannelProps extends ChatContextValue {
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentProps>;
  /** Function that overrides default sendMessage in chat client */
  doSendMessageRequest?(
    channelId: string,
    message: Client.Message,
  ): void | Promise<Client.MessageResponse>;
  /** Function that overrides default updateMessage in chat client */
  doUpdateMessageRequest?(
    channelId: string,
    message: Client.Message,
  ): void | Promise<Client.MessageResponse>;
}

export type listType = 'channel' | 'message' | 'default';

export interface LoadingErrorIndicatorProps {
  listType?: listType;
}
export interface EmptyStateIndicatorProps {
  listType?: listType;
}

export interface LoadingIndicatorProps {
  listType?: listType;
}
export interface DateSeparatorProps {
  message: Client.MessageResponse;
  formatDate(date: string): string;
}

export interface EventIndicatorProps {
  event:
    | Client.Event<Client.MemberAddedEvent>
    | Client.Event<Client.MemberRemovedEvent>;
}

export interface AvatarProps {
  /** image url */
  image?: string;
  /** name of the picture, used for title tag fallback */
  name?: string;
  /** size in pixels */
  size?: Number;
}

export interface File {
  uri: string;
  name?: string;
}

export interface FileUploadResponse {
  file: string;
  [name: string]: any;
}
export interface MessageInputProps
  extends KeyboardContextValue,
    ChannelContextValue,
    SuggestionsContextValue {
  /** The parent message object when replying on a thread */
  parent?: Client.Message | null;

  /** The component handling how the input is rendered */
  Input?: React.ElementType;

  /** Override image upload request */
  doImageUploadRequest?(file: File): Promise<FileUploadResponse>;

  /** Override file upload request */
  doFileUploadRequest?(file: File): Promise<FileUploadResponse>;
  maxNumberOfFiles?: number;
  hasImagePicker?: boolean;
  hasFilePicker?: boolean;
  focus?: boolean;
  /** https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js */
  actionSheetStyles?: object;
  AttachmentFileIcon?: React.ElementType<FileIconUIComponentProps>;
}

export interface AttachmentProps extends MessageContentContextValue {
  /** The attachment to render */
  attachment: Client.Attachment;
  /**
    The handler function to call when an action is selected on an attachment.
    Examples include canceling a \/giphy command or shuffling the results.
    */
  actionHandler?(name: string, value: string): any;
  groupStyle: 'single' | 'top' | 'middle' | 'bottom';
}

export interface ChannelListProps extends ChatContextValue {
  /** The Preview to use, defaults to ChannelPreviewLastMessage */
  Preview?: React.ElementType<ChannelPreviewUIComponentProps>;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  /** The indicator to use when there is error in fetching channels */
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  /** The indicator to use when channel list is empty */
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;

  List?: React.ElementType<ChannelListUIComponentProps>;

  onSelect(channel: Client.Channel): void;
  /**
   * Function that overrides default behaviour when users receives a
   * new message on channel not being watched.
   * It receives ChannelList (this) as first parameter, and event as second.
   */
  onMessageNew?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.NotificationNewMessageEvent>,
  ): void;
  /** Function that overrides default behaviour when users gets added to a channel */
  onAddedToChannel?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.NotificationAddedToChannelEvent>,
  ): void;
  /** Function that overrides default behaviour when users gets removed from a channel */
  onRemovedFromChannel?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.NotificationRemovedFromChannelEvent>,
  ): void;
  onChannelUpdated?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.ChannelUpdatedEvent>,
  ): void;
  onChannelDeleted?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.ChannelDeletedEvent>,
  ): void;
  onChannelTruncated?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.ChannelTruncatedEvent>,
  ): void;
  // TODO: Create proper interface for followings in chat js client.
  /** Object containing query filters */
  filters: object;
  /** Object containing query options */
  options?: object;
  /** Object containing sort parameters */
  sort?: object;
  loadMoreThreshold?: number;
  additionalFlatListProps?: object;
}

export interface ChannelListState {
  // Error in querying channels
  error: boolean | object;
  // List of channel objects.
  channels: SeamlessImmutable.Immutable<Client.Channel[]>;
  // List of channel ids.
  channelIds: SeamlessImmutable.Immutable<string[]>;
  // Channels are being loaded via query
  loadingChannels: boolean;
  // List of channels is being refreshed or requeries (in case of reconnection)
  refreshing: boolean;
  // Current offset of list of channels (for pagination)
  offset: number;
}

export interface ChannelListUIComponentProps
  extends ChannelListProps,
    ChannelListState {
  loadNextPage(): void;
}

export interface ChannelPreviewProps extends ChannelListUIComponentProps {
  Preview: React.ElementType<ChannelPreviewUIComponentProps>;
  key: string;
}

export interface ChannelPreviewState {
  unread: number;
  lastMessage: Client.MessageResponse;
  lastRead: Date;
}

export interface ChannelPreviewUIComponentProps
  extends ChannelPreviewProps,
    ChannelPreviewState {
  latestMessage: {
    text: string;
    created_at: string;
    messageObject: Client.MessageResponse;
  };
  /** Length at which latest message should be truncated */
  latestMessageLength: number;
}

export interface MessageListProps extends ChannelContextValue {
  /** Turn off grouping of messages by user */
  messageActions: Array<MessageAction>;
  noGroupByUser?: boolean;
  /** Weather its a thread of no. Default - false  */
  threadList?: boolean;
  disableWhileEditing?: boolean;
  /** For flatlist - https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold */
  loadMoreThreshold?: number;
  onMessageTouch?(
    e: GestureResponderEvent,
    message: Client.MessageResponse,
  ): void;
  dismissKeyboardOnMessageTouch?: boolean;
  /**
   * @deprecated User DateSeparator instead.
   *
   * Date separator component to render
   * */
  dateSeparator?: React.ElementType<DateSeparatorProps>;
  /** Date separator component to render  */
  DateSeparator?: React.ElementType<DateSeparatorProps>;
  /** Typing indicator component to render  */
  TypingIndicator?: React.ElementType<TypingIndicatorProps>;
  eventIndicator?: React.ElementType<EventIndicatorProps>;
  EventIndicator?: React.ElementType<EventIndicatorProps>;
  /**
   * @deprecated Use HeaderComponent instead.
   */
  headerComponent?: React.ElementType;
  /**
   * UI component for header of message list. By default message list doesn't have any header.
   * This is basically a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
   * used in MessageList. Its footer instead of header, since message list is inverted.
   *
   */
  HeaderComponent?: React.ElementType;
  onThreadSelect?(message: Client.MessageResponse): void;
  /** https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js */
  actionSheetStyles?: object;
  AttachmentFileIcon?: React.ElementType<FileIconUIComponentProps>;
  additionalFlatListProps?: object;
}

declare type MessageAction = 'edit' | 'delete' | 'reactions' | 'reply';
export interface MessageProps extends KeyboardContextValue {
  client: Client.StreamChat;
  onThreadSelect?(message: Client.MessageResponse): void;
  /** The message object */
  message: Client.Message;
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: Array<string>;
  /** A list of users that have read this message **/
  readBy: Array<Client.UserResponse>;
  /**
   * Message UI component to display a message in message list.
   * Avaialble from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
   * */
  Message?: React.ElementType<MessageUIComponentProps>;
  /**
   * Attachment UI component to display attachment in individual message.
   * Avaialble from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)
   * */
  Attachment: React.ElementType<AttachmentProps>;
  /** Latest message id on current channel */
  lastReceivedId: string;
  /** The function to update a message, handled by the Channel component */
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState?: object,
  ): void;
  retrySendMessage?(message: Client.Message): void;
  removeMessage?(updatedMessage: Client.MessageResponse): void;
  setEditingState?(message: Client.Message): void;
  /** Function executed when user clicks on link to open thread */
  openThread?(message: Client.Message, event: React.SyntheticEvent): void;
  channel: Client.Channel;
  editing: boolean | Client.MessageResponse;
  messageActions: boolean | string[];
  dismissKeyboard?(): void;
  onMessageTouch?(
    e: GestureResponderEvent,
    message: Client.MessageResponse,
  ): void;
  dismissKeyboardOnMessageTouch: boolean;
}

export interface MessageUIComponentProps
  extends MessageProps,
    KeyboardContextValue {
  reactionsEnabled: boolean;
  repliesEnabled: boolean;
  onMessageTouch?(
    e: GestureResponderEvent,
    message: Client.MessageResponse,
  ): void;
  onPress?(
    thisArg: React.Component<MessageUIComponentProps>,
    message: Client.MessageResponse,
    e: GestureResponderEvent,
  ): any;
  onLongPress?(
    thisArg: React.Component<MessageUIComponentProps>,
    message: Client.MessageResponse,
    e: GestureResponderEvent,
  ): any;
  handleReaction(reactionType: string, event?: React.BaseSyntheticEvent): void;
  handleDelete?(): void;
  handleEdit?(): void;
  handleFlag(event?: React.BaseSyntheticEvent): void;
  handleMute(event?: React.BaseSyntheticEvent): void;
  handleAction(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
  handleRetry(message: Client.Message): void;
  isMyMessage(message: Client.Message): boolean;
  /** Boolean if current message is part of thread */
  isThreadList: boolean;
  /**
   * Force alignment of message to left or right - 'left' | 'right'
   * By default, current user's messages will be aligned to right and other user's messages will be aligned to left.
   * */
  forceAlign: string | boolean;
  showMessageStatus: boolean;
  /** Custom UI component for message text */
  MessageText?: React.ElementType<MessageTextProps>;
  /** https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js */
  actionSheetStyles?: object;
  AttachmentFileIcon?: React.ElementType<FileIconUIComponentProps>;
  formatDate(date: string): string;
}

export interface MessageRepliesUIComponentProps {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Client.MessageResponse;
  /** Boolean if current message is part of thread */
  isThreadList: boolean;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
  openThread?(message: Client.Message, event: React.SyntheticEvent): void;
  /** right | left */
  pos: string;
}

export interface MessageStatusUIComponentProps {
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
  client: Client.StreamChat;
  /** A list of users who have read the message */
  readBy: Array<Client.UserResponse>;
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Client.MessageResponse;
  /** Latest message id on current channel */
  lastReceivedId: string;
  /** Boolean if current message is part of thread */
  isThreadList: boolean;
}

export interface MessageAvatarUIComponentProps {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Client.MessageResponse;
  /**
   * Returns true if message (param) belongs to current user, else false
   *
   * @param message
   * */
  isMyMessage?(message: Client.MessageResponse): boolean;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: [];
}

export interface MessageContentUIComponentProps
  extends MessageUIComponentProps {
  alignment: string;
}

export interface MessageTextContainerUIComponentProps {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Client.MessageResponse;
  /**
   * Position of message in group - top, bottom, middle, single.
   *
   * Message group is a group of consecutive messages from same user. groupStyles can be used to style message as per their position in message group
   * e.g., user avatar (to which message belongs to) is only showed for last (bottom) message in group.
   */
  groupStyles: [];
  /**
   * Returns true if message (param) belongs to current user, else false
   *
   * @param message
   * */
  isMyMessage?(message: Client.MessageResponse): boolean;
  /** Custom UI component for message text */
  MessageText?: React.ElementType<MessageTextProps>;
  /** Complete theme object. Its a [defaultTheme](https://github.com/GetStream/stream-chat-react-native/blob/master/src/styles/theme.js#L22) merged with customized theme provided as prop to Chat component */
  theme?: object;
}

export interface MessageTextProps {
  message: Client.MessageResponse;
}

export interface ThreadProps extends ChannelContextValue {
  /** the thread (the parent message object) */
  thread: SeamlessImmutable.Immutable<Client.MessageResponse>;
  /** The list of messages to render, state is handled by the parent channel component */
  threadMessages?: Client.MessageResponse[];
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
  additionalParentMessageProps?: object;
  additionalMessageListProps?: object;
  additionalMessageInputProps?: object;
}

export interface TypingIndicatorProps {
  typing: [];
  client: Client.StreamChat;
}

export interface FileIconUIComponentProps {
  size: number;
  mimeType?: string;
}

export interface AutoCompleteInputProps {
  value: string;
  openSuggestions?(title: string, component: React.ElementType<any>): void;
  closeSuggestions?(): void;
  updateSuggestions?(param: object): void;
  triggerSettings: object;
  setInputBoxRef?(ref: any): void;
  onChange?(text: string): void;
  additionalTextInputProps: object;
}

export interface CardProps {
  title?: string;
  title_link?: string;
  og_scrape_url?: string;
  image_url?: string;
  thumb_url?: string;
  text?: string;
  type?: string;
  alignment?: 'right' | 'left';
  onLongPress?: (event: GestureResponderEvent) => void;
}

export interface CommandsItemProps {
  name: string;
  args: string;
  description: string;
}

export interface DateSeparatorProps {
  message: Client.MessageResponse;
  formatDate?(date: Date): string;
}
export interface FileAttachmentGroupProps {
  messageId: string;
  files: [];
  handleAction?(): void;
  alignment: 'right' | 'left';
  AttachmentFileIcon: React.ElementType<any>;
}
export interface FileUploadPreviewProps {
  fileUploads: [];
  removeFile?(id: string): void;
  retryUpload?(id: string): Promise<any>;
  AttachmentFileIcon: React.ElementType<any>;
}
export interface GalleryProps {
  images: Client.Attachment[];
  onLongPress: (event: GestureResponderEvent) => void;
  alignment: 'right' | 'left';
}
export interface IconSquareProps {
  icon: string;
  onPress?(event: GestureResponderEvent): void;
}
export interface ImageUploadPreviewProps {
  imageUploads: Array<{
    [id: string]: {
      id: string;
      file: File;
      status: string;
    };
  }>;
  removeImage?(id: string): void;
  retryUpload?(id: string): Promise<any>;
}
export interface KeyboardCompatibleViewProps {}

export interface EmptyStateIndicatorProps {
  listType?: listType;
}
export interface EventIndicatorProps {
  event:
    | Client.Event<Client.MemberAddedEvent>
    | Client.Event<Client.MemberRemovedEvent>
    | null;
}

export interface LoadingErrorIndicatorProps {
  listType?: listType;
}
export interface LoadingIndicatorProps {
  listType?: listType;
}
export interface MentionsItemProps {
  item: {
    name?: string;
    icon: string;
    id?: string;
  };
}

export interface MessageNotificationProps {
  showNotification: boolean;
  onPress?(event: GestureResponderEvent): void;
}

export interface MessageSystemProps {
  message: Client.MessageResponse;
}

export interface ReactionListProps {
  latestReactions: Client.ReactionResponse[];
  openReactionSelector?(event: GestureResponderEvent): void;
  getTotalReactionCount?(): string | number;
  visible: boolean;
  position: string;
}

export interface ReactionPickerProps {
  hideReactionOwners: boolean;
  reactionPickerVisible: boolean;
  handleDismiss?(): void;
  handleReaction?(id: string): void;
  latestReactions: Client.ReactionResponse[];
  reactionCounts: { [key: string]: number };
  rpLeft: string | number;
  rpTop: string | number;
  rpRight: string | number;
  emojiData: Array<{
    icon: string;
    id: string;
  }>;
}

export interface ReactionPickerWrapperProps {
  isMyMessage?(message: Client.MessageResponse): boolean;
  message: Client.MessageResponse;
  offset: string | number;
  handleReaction?(id: string): void;
  emojiData: Array<{
    icon: string;
    id: string;
  }>;
  style: object;
}

export interface SpinnerProps {}

export interface SuggestionsProviderProps {
  active: boolean;
  marginLeft: string | number;
  width: string | number;
  suggestions: object;
  backdropHeight: string | number;
  handleDismiss?(event: GestureResponderEvent): void;
  suggestionsTitle: string;
}
export interface UploadProgressIndicatorProps {
  active: boolean;
  type: 'in_progress' | 'retry';
  action?(event: GestureResponderEvent): void;
}

export interface AttachmentActionsProps {
  text: string;
  actions: Client.Action[];
  actionHandler?(name: string, value: string): any;
}

//================================================================================================
//================================================================================================
//
//                                Component types
//
//================================================================================================
//================================================================================================
export class AutoCompleteInput extends React.PureComponent<
  AutoCompleteInputProps,
  any
> {}
export class Card extends React.PureComponent<CardProps, any> {}
export class CommandsItem extends React.PureComponent<CommandsItemProps, any> {}
export class DateSeparator extends React.PureComponent<
  DateSeparatorProps,
  any
> {}
export class EmptyStateIndicator extends React.PureComponent<
  EmptyStateIndicatorProps,
  any
> {}
export class EventIndicator extends React.PureComponent<
  EventIndicatorProps,
  any
> {}
export class FileAttachmentGroup extends React.PureComponent<
  FileAttachmentGroupProps,
  any
> {}
export class FileUploadPreview extends React.PureComponent<
  FileUploadPreviewProps,
  any
> {}
export class Gallery extends React.PureComponent<GalleryProps, any> {}
export class IconSquare extends React.PureComponent<IconSquareProps, any> {}
export class ImageUploadPreview extends React.PureComponent<
  ImageUploadPreviewProps,
  any
> {}
export class KeyboardCompatibleView extends React.PureComponent<
  KeyboardCompatibleViewProps,
  any
> {}
export class LoadingErrorIndicator extends React.PureComponent<
  LoadingErrorIndicatorProps,
  any
> {}
export class LoadingIndicator extends React.PureComponent<
  LoadingIndicatorProps,
  any
> {}
export class MentionsItem extends React.PureComponent<MentionsItemProps, any> {}
export class Message extends React.PureComponent<MessageProps, any> {}
export class MessageNotification extends React.PureComponent<
  MessageNotificationProps,
  any
> {}
export class MessageSystem extends React.PureComponent<
  MessageSystemProps,
  any
> {}
export class ReactionList extends React.PureComponent<ReactionListProps, any> {}
export class ReactionPicker extends React.PureComponent<
  ReactionPickerProps,
  any
> {}
export class ReactionPickerWrapper extends React.PureComponent<
  ReactionPickerWrapperProps,
  any
> {}
export class Spinner extends React.PureComponent<SpinnerProps, any> {}
export class SuggestionsProvider extends React.PureComponent<
  SuggestionsProviderProps,
  any
> {}
export class UploadProgressIndicator extends React.PureComponent<
  UploadProgressIndicatorProps,
  any
> {}
export class Attachment extends React.PureComponent<AttachmentProps, any> {}
export class AttachmentActions extends React.PureComponent<
  AttachmentActionsProps,
  any
> {}

export class Avatar extends React.PureComponent<AvatarProps, any> {}
export class Chat extends React.PureComponent<ChatProps, any> {}
export class Channel extends React.PureComponent<ChannelProps, any> {}
export class MessageList extends React.PureComponent<MessageListProps, any> {}
export class TypingIndicator extends React.PureComponent<
  TypingIndicatorProps,
  any
> {}
export class MessageInput extends React.PureComponent<MessageInputProps, any> {}

export class MessageSimple extends React.PureComponent<
  MessageUIComponentProps,
  any
> {}
export class MessageContent extends React.PureComponent<
  MessageContentUIComponentProps,
  any
> {}
export class MessageReplies extends React.PureComponent<
  MessageRepliesUIComponentProps,
  any
> {}
export class MessageStatus extends React.PureComponent<
  MessageStatusUIComponentProps,
  any
> {}
export class MessageAvatar extends React.PureComponent<
  MessageAvatarUIComponentProps,
  any
> {}

export class MessageTextContainer extends React.PureComponent<
  MessageTextContainerUIComponentProps,
  any
> {}

export class ChannelList extends React.PureComponent<ChannelListProps, any> {}

export class Thread extends React.PureComponent<ThreadProps, any> {}
export class ChannelPreviewMessenger extends React.PureComponent<
  ChannelPreviewUIComponentProps,
  any
> {}
export class CloseButton extends React.PureComponent {}
export class IconBadge extends React.PureComponent {}
export class FileIcon extends React.PureComponent<
  FileIconUIComponentProps,
  {}
> {}

//================================================================================================
//================================================================================================
//
//                                Others
//
//================================================================================================
//================================================================================================
export function registerNativeHandlers(handlers: {
  NetInfo: object;
  pickImage(): Promise<any>;
  pickDocument(): Promise<any>;
}): void;
