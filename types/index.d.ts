// TypeScript Version: 2.8

import * as React from 'react';
import { Text, GestureResponderEvent } from 'react-native';
import * as Client from 'stream-chat';
import * as SeamlessImmutable from 'seamless-immutable';

declare function withChatContext(): React.FC;

interface ChatContext extends React.Context<ChatContextValue> {}
interface ChatContextValue {
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
interface SuggestionsContext extends React.Context<SuggestionsContextValue> {}
interface SuggestionsContextValue {
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
interface ChannelContext extends React.Context<ChannelContextValue> {}
interface ChannelContextValue {
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

interface KeyboardContext extends React.Context<KeyboardContextValue> {}
interface KeyboardContextValue {
  dismissKeyboard?(): void;
}

export interface ChatProps {
  client: Client.StreamChat;
  style?: object;
}

interface ChannelProps extends ChatContextValue {
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentProps>;
}

export interface EmptyStateIndicatorProps {
  listType?: 'channel' | 'message' | 'default';
}

export interface LoadingErrorIndicatorProps {
  listType?: 'channel' | 'message' | 'default';
}

export interface LoadingIndicatorProps {
  listType: 'channel' | 'message' | 'default';
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

interface AvatarProps {
  /** image url */
  image?: string;
  /** name of the picture, used for title tag fallback */
  name?: string;
  /** size in pixels */
  size?: Number;
}

interface File {
  uri: string;
  name?: string;
}

interface FileUploadResponse {
  file: string;
  [name: string]: any;
}
interface MessageInputProps
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

interface AttachmentProps {
  /** The attachment to render */
  attachment: Client.Attachment;
  /**
    The handler function to call when an action is selected on an attachment.
    Examples include canceling a \/giphy command or shuffling the results.
    */
  actionHandler(): void;
  groupStyle: 'single' | 'top' | 'middle' | 'bottom';
}

interface ChannelListProps extends ChatContextValue {
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
    e: Client.NotificationNewMessageEvent,
  ): void;
  /** Function that overrides default behaviour when users gets added to a channel */
  onAddedToChannel?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.NotificationAddedToChannelEvent,
  ): void;
  /** Function that overrides default behaviour when users gets removed from a channel */
  onRemovedFromChannel?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.NotificationRemovedFromChannelEvent,
  ): void;
  onChannelUpdated?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.ChannelUpdatedEvent,
  ): void;
  // TODO: Create proper interface for followings in chat js client.
  /** Object containing query filters */
  filters: object;
  /** Object containing query options */
  options?: object;
  /** Object containing sort parameters */
  sort?: object;
  loadMoreThreshold?: number;
}

interface ChannelListState {
  // Error in querying channels
  error: boolean;
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

interface ChannelListUIComponentProps
  extends ChannelListProps,
    ChannelListState {
  loadNextPage(): void;
}

interface ChannelPreviewProps extends ChannelListUIComponentProps {
  Preview: React.ElementType<ChannelPreviewUIComponentProps>;
  key: string;
}

interface ChannelPreviewState {
  unread: number;
  lastMessage: Client.MessageResponse;
  lastRead: Date;
}

interface ChannelPreviewUIComponentProps
  extends ChannelPreviewProps,
    ChannelPreviewState {
  latestMessage: {
    text: string;
    created_at: string;
  };
}

interface MessageListProps extends ChannelContextValue {
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
}

declare type MessageAction = 'edit' | 'delete' | 'reactions' | 'reply';
interface MessageProps extends KeyboardContextValue {
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
}

interface MessageUIComponentProps extends MessageProps, KeyboardContextValue {
  reactionsEnabled: boolean;
  repliesEnabled: boolean;
  onMessageTouch?(
    e: GestureResponderEvent,
    message: Client.MessageResponse,
  ): void;
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
  MessageText?: React.ElementType<MessageTextProps>;
  /** https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js */
  actionSheetStyles?: object;
  AttachmentFileIcon?: React.ElementType<FileIconUIComponentProps>;
}

interface MessageTextProps {
  message: Client.MessageResponse;
}
interface ThreadProps extends ChannelContextValue {
  /** the thread (the parent message object) */
  thread: SeamlessImmutable.Immutable<Client.MessageResponse>;
  /** The list of messages to render, state is handled by the parent channel component */
  threadMessages?: Client.MessageResponse[];
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
}

interface TypingIndicatorProps {
  typing: [];
  client: Client.StreamChat;
}

interface FileIconUIComponentProps {
  size: number;
  mimeType?: string;
}

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
export function registerNativeHandlers(handlers: {
  NetInfo: object;
  pickImage(): Promise<any>;
  pickDocument(): Promise<any>;
}): void;
