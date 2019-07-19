// TypeScript Version: 3.5

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
interface SuggestionsContextValue {}

declare function withChannelContext(): React.FC;
interface ChannelContext extends React.Context<ChannelContextValue> {}
interface ChannelContextValue {
  error?: boolean;
  // Loading the intial content of the channel
  loading?: boolean;
  // Loading more messages
  loadingMore?: boolean;
  hasMore?: boolean;
  messages?: Client.MessageResponse[];
  online?: boolean;
  // TODO: Create proper type for typing object
  typing?: SeamlessImmutable.Immutable<{
    [user_id: string]: Client.TypingStartEvent;
  }>;
  watchers?: SeamlessImmutable.Immutable<Object>;
  watcher_count?: number;
  members?: SeamlessImmutable.Immutable<Object>;
  read?: SeamlessImmutable.Immutable<Object>;

  threadMessages?: Client.MessageResponse[];
  threadLoadingMore?: boolean;
  threadHasMore?: boolean;
  kavEnabled?: boolean;

  client?: Client.StreamChat;
  channel?: Client.StreamChat;

  multipleUploads?: boolean;
  acceptedFiles?: string[];
  maxNumberOfFiles?: number;

  // thread related
  loadMoreThread?(): void;

  /** The function to update a message, handled by the Channel component */
  updateMessage?(
    updatedMessage: Client.MessageResponse,
    extraState: object,
  ): void;

  removeMessage?(updatedMessage: Client.MessageResponse): void;
  sendMessage?(message: Client.Message): void;
  /** Function executed when user clicks on link to open thread */
  retrySendMessage?(message: Client.Message): void;
  setEditingState?(message: Client.Message): void;
  clearEditingState?(): void;
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  markRead?(): void;
  loadMore?(): void;

  openThread?(message: Client.Message, event: React.SyntheticEvent): void;
  closeThread?(): void;
}

interface KeyboardContext extends React.Context<KeyboardContextValue> {}
interface KeyboardContextValue {
  dismissKeyboard(): void;
}

export interface ChatProps {
  client: Client.StreamChat;
  style?: object;
}

interface ChannelProps {
  /** Which channel to connect to, will initialize the channel if it's not initialized yet */
  channel?: Client.Channel;
  /** Client is passed automatically via the Chat ContextValue */
  client?: Client.StreamChat;
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
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
  event: Client.MemberAddedEvent | Client.MemberRemovedEvent;
}

interface AvatarProps {
  /** image url */
  image?: string;
  /** name of the picture, used for title tag fallback */
  name?: string;
  /** size in pixels */
  size?: Number;
}

interface MessageInputProps {
  /** The parent message object when replying on a thread */
  parent?: Client.Message | null;

  /** The component handling how the input is rendered */
  Input?: React.ElementType;

  /** Override image upload request */
  doImageUploadRequest?: Function;

  /** Override file upload request */
  doFileUploadRequest?: Function;
  maxNumberOfFiles?: number;
  hasImagePicker?: boolean;
  hasFilePicker?: boolean;
  focus?: boolean;
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
    thisArg: ChannelList,
    e: Client.NotificationNewMessageEvent,
  ): void;
  /** Function that overrides default behaviour when users gets added to a channel */
  onAddedToChannel?(
    thisArg: ChannelList,
    e: Client.NotificationAddedToChannelEvent,
  ): void;
  /** Function that overrides default behaviour when users gets removed from a channel */
  onRemovedFromChannel?(
    thisArg: ChannelList,
    e: Client.NotificationRemovedFromChannelEvent,
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
  error: boolean;
  loading: boolean;
  channels: SeamlessImmutable.Immutable<Client.Channel[]>;
  channelIds: SeamlessImmutable.Immutable<string[]>;
  loadingChannels: boolean;
  refreshing: boolean;
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
  /** Date separator component to render  */
  dateSeparator?: React.ElementType<DateSeparatorProps>;
  /** The attachment component to render, defaults to Attachment */
  Attachment?: React.ElementType;
  /** Typing indicator component to render  */
  TypingIndicator?: React.ElementType;
  /** Turn off grouping of messages by user */
  noGroupByUser?: boolean;
  /** Weather its a thread of no. Default - false  */
  threadList?: boolean;
  disableWhileEditing?: boolean;
  Message?: React.ElementType<MessageUIComponentProps>;
  EventIndicator?: React.ElementType<EventIndicatorProps>;
  /** For flatlist  */
  loadMoreThreshold?: number;
  onThreadSelect?(message: Client.MessageResponse): void;
  messageActions: Array<MessageAction>;
}

declare type MessageAction = 'edit' | 'delete' | 'reactions' | 'reply';
interface MessageProps extends ChannelContextValue {
  onThreadSelect?(message: Client.MessageResponse): void;
  /** The message object */
  message: Client.Message;
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: Array<string>;
  /** The message rendering component, the Message component delegates its rendering logic to this component */
  Message: React.ElementType<MessageUIComponentProps>;
  /** A list of users that have read this message **/
  readBy: Array<Client.User>;
  lastReceivedId?: string;
  threadList: boolean;
  messageActions: 'edit' | 'delete' | 'reactions' | 'reply';
  /** Allows you to overwrite the attachment component */
  Attachment: React.ElementType<AttachmentProps>;
}

interface MessageUIComponentProps extends MessageProps, KeyboardContextValue {
  reactionsEnabled: boolean;
  repliesEnabled: boolean;
  handleReaction(reactionType: string, event?: React.BaseSyntheticEvent): void;
  handleFlag(event?: React.BaseSyntheticEvent): void;
  handleMute(event?: React.BaseSyntheticEvent): void;
  handleAction(
    name: string,
    value: string,
    event: React.BaseSyntheticEvent,
  ): void;
  handleRetry(message: Client.Message): void;
  isMyMessage(message: Client.Message): boolean;
}

interface ThreadProps extends ChannelContextValue {
  /** the thread (the parent message object) */
  thread?: Client.MessageResponse | boolean;
  /** The message component to use for rendering messages */
  Message?: React.ElementType;
  /** The list of messages to render, state is handled by the parent channel component */
  threadMessages?: Client.MessageResponse[];
  /** Make input focus on mounting thread */
  autoFocus?: boolean;
}

interface TypingIndicatorProps {
  typing: [];
  client: Client.StreamChat;
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

export function registerNativeHandlers(handlers: {
  NetInfo: object;
  pickImage(): Promise<any>;
  pickDocument(): Promise<any>;
}): void;
