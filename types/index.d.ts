// TypeScript Version: 2.8

import * as React from 'react';
import { FlatList, GestureResponderEvent } from 'react-native';
import * as Client from 'stream-chat';
import * as SeamlessImmutable from 'seamless-immutable';
import * as i18next from 'i18next';

//================================================================================================
//================================================================================================
//
//                                Context types
//
//================================================================================================
//================================================================================================
declare function withChatContext<T>(
  OriginalComponent: React.ElementType<T>,
): React.ElementType<T>;
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

declare function withTranslationContext<T>(
  OriginalComponent: React.ElementType<T>,
): React.ElementType<T>;
export interface TranslationContext
  extends React.Context<TranslationContextValue> {}
export interface TranslationContextValue {
  t?: i18next.TFunction;
  tDateTimeParser?(datetime: string | number): object;
}

declare function withSuggestionsContext<T>(
  OriginalComponent: React.ElementType<T>,
): React.ElementType<T>;
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

declare function withChannelContext<T>(
  OriginalComponent: React.ElementType<T>,
): React.ElementType<T>;
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
  disabled?: boolean;
}

export interface KeyboardContext extends React.Context<KeyboardContextValue> {}
export interface KeyboardContextValue {
  dismissKeyboard?(): void;
}

export interface MessageContentContext
  extends React.Context<MessageContentContextValue> {}
export interface MessageContentContextValue {
  onLongPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  additionalTouchableProps?: object;
}

//================================================================================================
//================================================================================================
//
//                                Props types
//
//================================================================================================
//================================================================================================
export interface ChatProps extends StyledComponentProps {
  /** The StreamChat client object */
  client: Client.StreamChat;
  /**
   * Theme object
   *
   * @ref https://getstream.io/chat/react-native-chat/tutorial/#custom-styles
   * */
  style?: object;
  i18nInstance?: Streami18n;
}

export interface ChannelProps
  extends ChatContextValue,
    TranslationContextValue {
  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType;
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  Message?: React.ElementType<MessageUIComponentProps>;
  Attachment?: React.ElementType<AttachmentProps>;
  /** Function that overrides default markRead in channel */
  doMarkReadRequest?(channel: Client.Channel): void;
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
  /**
   * If true, KeyboardCompatibleView wrapper is disabled.
   *
   * Channel component internally uses [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js) component
   * internally to adjust the height of Channel component when keyboard is opened or dismissed. This prop gives you ability to disable this functionality, in case if you
   * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or you want to handle keyboard dismissal yourself.
   * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
   *
   * Defaults value is false.
   * */
  disableKeyboardCompatibleView?: boolean;
  /**
   * Custom wrapper component that handles height adjustment of Channel component when keyboard is opened or dismissed.
   * Defaults to [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView.js)
   *
   * This prop can be used to configure default KeyboardCompatibleView component.
   * e.g.,
   * <Channel
   *  channel={channel}
   *  ...
   *  KeyboardCompatibleView={(props) => {
   *    return (
   *      <KeyboardCompatibleView keyboardDismissAnimationDuration={200} keyboardOpenAnimationDuration={200}>
   *        {props.children}
   *      </KeyboardCompatibleView>
   *    )
   *  }}
   * />
   */
  KeyboardCompatibleView?: React.ElementType<KeyboardCompatibleViewProps>;
  disableIfFrozenChannel?: boolean;
}

export type listType = 'channel' | 'message' | 'default';

export interface StyledComponentProps {
  style?: object;
}

export interface LoadingErrorIndicatorProps extends StyledComponentProps {
  listType?: listType;
}
export interface EmptyStateIndicatorProps extends StyledComponentProps {
  listType?: listType;
}

export interface LoadingIndicatorProps extends StyledComponentProps {
  listType?: listType;
}
export interface DateSeparatorProps
  extends StyledComponentProps,
    TranslationContextValue {
  message: Client.MessageResponse;
  formatDate(date: string): string;
}

export interface EventIndicatorProps
  extends StyledComponentProps,
    TranslationContextValue {
  event:
    | Client.Event<Client.MemberAddedEvent>
    | Client.Event<Client.MemberRemovedEvent>;
}

export interface AvatarProps extends StyledComponentProps {
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
    SuggestionsContextValue,
    TranslationContextValue,
    StyledComponentProps {
  /** Callback that is called when the text input's text changes. Changed text is passed as a single string argument to the callback handler. */
  onChangeText?(newText: string): void;
  /** Initial value to set on input */
  initialValue?: string;
  /** The parent message object when replying on a thread */
  parent?: Client.Message | null;

  /** The component handling how the input is rendered */
  Input?: React.ElementType<InputUIComponentProps>;

  /** Override image upload request */
  doImageUploadRequest?(file: File): Promise<FileUploadResponse>;

  /** Override file upload request */
  doFileUploadRequest?(file: File): Promise<FileUploadResponse>;
  maxNumberOfFiles?: number;
  hasImagePicker?: boolean;
  hasFilePicker?: boolean;
  focus?: boolean;
  sendImageAsync?: boolean;
  /** https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js */
  actionSheetStyles?: object;
  AttachmentFileIcon?: React.ElementType<FileIconUIComponentProps>;
  AttachButton?: React.ElementType<AttachButtonProps>;
  SendButton: React.ElementType<SendButtonProps>;
}

export interface DocumentPickerFile {
  cancelled: boolean;
  uri?: string;
  name?: string;
}

export interface ImagePickerFile {
  cancelled: boolean;
  uri?: string;
}
export interface InputUIComponentProps {
  /** Returns list of users. This is used suggestions list for mentions feature (when user types '@') */
  getUsers?(): Client.UserResponse[];
  /** When item from mention's suggestion list is selected. This callback handler adds it to `mentioned_users` list of message */
  onSelectItem?(): void;
  /** Checks if the message is valid or not. Accordingly we can enable/disable send button */
  isValidMessage?(): boolean;
  /** Sends the current message */
  sendMessage?(): void;
  /** Sends the current edited message */
  updateMessage?(): Promise<void>;
  /** Handler for attach file functionality */
  _pickFile?(): void;
  /** Adds selected file to state of MessageInput component (`state.fileUploads` list) and calls _uploadFile */
  uploadNewFile?(file: DocumentPickerFile): void;
  /** Uploads the selected file corresponding to id in fileUploads array in state of MessageInput */
  _uploadFile?(id: string): void;
  _removeFile?(id: string): void;
  /** Handler for attach image functionality */
  _pickImage?(): Promise<void>;
  /** Adds selected file to state of MessageInput component (`state.imageUploads` list) and calls _uploadImage */
  uploadNewImage?(file: ImagePickerFile): void;
  /** Uploads the selected image corresponding to id in imageUploads array in state of MessageInput */
  _uploadImage?(): void;
  _removeImage?(id: string): void;
  /** Callback when text in inputbox changes */
  onChangeText?(text: string): void;
  /** object the ref via callback - https://reactjs.org/docs/refs-and-the-dom.html#callback-refs */
  setInputBoxRef?(ref: any): void;
  /** Returns all available list of commands */
  getCommands?(): Client.CommandResponse[];
  /** Hides the attach actionsheet */
  closeAttachActionSheet?(): void;
  /** Append the text to input box */
  appendText?(text: string): void;
  triggerSettings?(): object;
  disabled?: boolean;
  value?: string;
  additionalTextInputProps?: object;
}

export interface AttachmentProps
  extends StyledComponentProps,
    MessageContentContextValue {
  /** The attachment to render */
  attachment: Client.Attachment;
  /**
    The handler function to call when an action is selected on an attachment.
    Examples include canceling a \/giphy command or shuffling the results.
    */
  actionHandler?(name: string, value: string): any;

  UrlPreview?: React.ElementType<CardProps>;
  Giphy?: React.ElementType<CardProps>;
  Card?: React.ElementType<CardProps>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader?: React.ElementType<CardProps>;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover?: React.ElementType<CardProps>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter?: React.ElementType<CardProps>;
  FileAttachment?: React.ElementType<FileAttachmentGroup>;
  AttachmentActions?: React.ElementType<AttachmentActionsProps>;
  Gallery?: React.ElementType<GalleryProps>;

  groupStyle: 'single' | 'top' | 'middle' | 'bottom';
}

export interface ChannelListProps
  extends StyledComponentProps,
    ChatContextValue {
  /** The Preview to use, defaults to ChannelPreviewLastMessage */
  Preview?: React.ElementType<ChannelPreviewUIComponentProps>;

  /** The loading indicator to use */
  LoadingIndicator?: React.ElementType<LoadingIndicatorProps>;
  /** The indicator to use when there is error in fetching channels */
  LoadingErrorIndicator?: React.ElementType<LoadingErrorIndicatorProps>;
  /** The indicator to use when channel list is empty */
  EmptyStateIndicator?: React.ElementType<EmptyStateIndicatorProps>;
  /**
   * The indicator to display network-down error at top of list, if there is connectivity issue
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
   */
  HeaderNetworkDownIndicator?: React.ElementType<
    ChannelListHeaderNetworkDownIndicatorProps
  >;
  /**
   * The indicator to display error at top of list, if there was an error loading some page/channels after the first page.
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
   */
  HeaderErrorIndicator?: React.ElementType<
    ChannelListHeaderErrorIndicatorProps
  >;
  /**
   * Loading indicator to display at bottom of the list, while loading further pages.
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
   */
  FooterLoadingIndicator?: React.ElementType<
    ChannelListFooterLoadingIndicatorProps
  >;

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
  onChannelHidden?(
    thisArg: React.Component<ChannelListProps>,
    e: Client.Event<Client.ChannelHiddenEvent>,
  ): void;
  // TODO: Create proper interface for followings in chat js client.
  /** Object containing query filters */
  filters: object;
  /** Object containing query options */
  options?: object;
  /** Object containing sort parameters */
  sort?: object;
  loadMoreThreshold?: number;
  /**
   * Besides existing (default) UX behaviour of underlying flatlist of ChannelList component, if you want
   * to attach some additional props to un derlying flatlist, you can add it to following prop.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
   * e.g.
   * ```
   * <MessageList
   *  filters={filters}
   *  sort={sort}
   *  additionalFlatListProps={{ bounces: true }} />
   * ```
   */
  additionalFlatListProps?: object;
  /**
   * Use `setFlatListRef` to get access to ref to inner FlatList.
   *
   * e.g.
   * <MessageList
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own good
   *  }}
   */
  setFlatListRef?(
    ref: React.RefObject<FlatList<Client.Channel>>,
  ): PropTypes.func;
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
    ChannelListState,
    StyledComponentProps {
  reloadList(): void;
  loadNextPage(): void;
  refreshList(): void;
}

export interface ChannelListHeaderNetworkDownIndicatorProps
  extends TranslationContextValue {}
export interface ChannelListHeaderErrorIndicatorProps
  extends TranslationContextValue {
  onPress?: () => void;
}
export interface ChannelListFooterLoadingIndicatorProps {}

export interface ChannelPreviewProps
  extends ChannelListUIComponentProps,
    TranslationContextValue {
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
    ChannelPreviewState,
    StyledComponentProps {
  latestMessage: {
    text: string;
    created_at: string;
    messageObject: Client.MessageResponse;
  };
  /** Length at which latest message should be truncated */
  latestMessageLength: number;
}

export interface MessageListProps
  extends ChannelContextValue,
    TranslationContextValue,
    StyledComponentProps {
  /** Turn off grouping of messages by user */
  messageActions?: Array<MessageAction>;
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
  /**
   * Besides existing (default) UX behaviour of underlying flatlist of ChannelList component, if you want
   * to attach some additional props to un derlying flatlist, you can add it to following prop.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
   * e.g.
   * ```
   * <MessageList
   *  filters={filters}
   *  sort={sort}
   *  additionalFlatListProps={{ bounces: true }} />
   * ```
   */
  additionalFlatListProps?: object;
  /**
   * Use `setFlatListRef` to get access to ref to inner FlatList.
   *
   * e.g.
   * <MessageList
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own custom functionality
   *  }}
   */
  setFlatListRef?(ref: React.RefObject<FlatList<object>>): void;
}

declare type MessageAction = 'edit' | 'delete' | 'reactions' | 'reply';
export interface MessageProps extends KeyboardContextValue {
  client: Client.StreamChat;
  onThreadSelect?(message: Client.MessageResponse): void;
  /** The message object */
  message: Client.MessageResponse;
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
  disabled?: boolean;
}

export interface MessageUIComponentProps
  extends MessageProps,
    KeyboardContextValue,
    StyledComponentProps {
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
  hideReactionCount?: boolean;
  hideReactionOwners?: boolean;
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
  isMyMessage(message: Client.MessageResponse): boolean;
  /** Boolean if current message is part of thread */
  isThreadList: boolean;
  /**
   * Force alignment of message to left or right - 'left' | 'right'
   * By default, current user's messages will be aligned to right and other user's messages will be aligned to left.
   * */
  forceAlign: string | boolean;
  showMessageStatus: boolean;
  /** Custom UI component for the avatar next to a message */
  MessageAvatar?: React.ElementType<MessageAvatarUIComponentProps>;
  /** Custom UI component for message content */
  MessageContent?: React.ElementType<MessageContentUIComponentProps>;
  /** Custom UI component for message status (delivered/read) */
  MessageStatus?: React.ElementType<MessageStatusUIComponentProps>;
  /** Custom UI component for Messages of type "system" */
  MessageSystem?: React.ElementType<MessageSystemProps>;
  /** Custom UI component for message text */
  MessageText?: React.ElementType<MessageTextProps>;
  /** Custom UI component for message footer */
  MessageHeader?: React.ElementType<MessageHeaderUIComponentProps>;
  /** Custom UI component for message footer */
  MessageFooter?: React.ElementType<MessageFooterUIComponentProps>;
  /** Custom UI component for reaction list */
  ReactionList?: React.ElementType<ReactionListProps>;
  /**
   * Custom UI component to display enriched url preview.
   * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  UrlPreview?: React.ElementType<CardProps>;
  /**
   * Custom UI component to display Giphy image.
   * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Giphy?: React.ElementType<CardProps>;
  /**
   * Custom UI component to display group of File type attachments or multiple file attachments (in single message).
   * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachmentGroup.js
   */
  FileAttachmentGroup?: React.ElementType<FileAttachmentGroupProps>;
  /**
   * Custom UI component to display File type attachment.
   * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileAttachment.js
   */
  FileAttachment?: React.ElementType<FileAttachmentProps>;
  /**
   * Custom UI component to display image attachments.
   * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Gallery.js
   */
  Gallery?: React.ElementType<GalleryProps>;
  /**
   * Custom UI component to display generic media type e.g. giphy, url preview etc
   * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Card.js
   */
  Card?: React.ElementType<CardProps>;
  /**
   * Custom UI component to override default header of Card component.
   * Accepts the same props as Card component.
   */
  CardHeader?: React.ElementType<CardProps>;
  /**
   * Custom UI component to override default cover (between Header and Footer) of Card component.
   * Accepts the same props as Card component.
   */
  CardCover?: React.ElementType<CardProps>;
  /**
   * Custom UI component to override default Footer of Card component.
   * Accepts the same props as Card component.
   */
  CardFooter?: React.ElementType<CardProps>;

  /**
   * Custom UI component to display attachment actions. e.g., send, shuffle, cancel in case of giphy
   * Deaults to https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/AttachmentActions.js
   */
  AttachmentActions?: React.ElementType<AttachmentActionsProps>;
  /**
   * List of supported/allowed reactions.
   * e.g.,
   * [
   *  {
   *    id: 'like',
   *    icon: '👍',
   *  },
   *  {
   *    id: 'love',
   *    icon: '❤️️',
   *  },
   *  {
   *    id: 'haha',
   *    icon: '😂',
   *  },
   *  {
   *    id: 'wow',
   *    icon: '😮',
   *  },
   * ]
   */
  supportedReactions?: Array<{
    icon: string;
    id: string;
  }>;
  /** https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js */
  actionSheetStyles?: object;
  AttachmentFileIcon?: React.ElementType<FileIconUIComponentProps>;
  formatDate(date: string): string;
  additionalTouchableProps?: object;
  markdownRules?: object; // TODO: typescript the markdown lib
}

export interface MessageHeaderUIComponentProps
  extends MessageContentUIComponentProps {}

export interface MessageFooterUIComponentProps
  extends MessageContentUIComponentProps {}

export interface MessageRepliesUIComponentProps
  extends TranslationContextValue,
    StyledComponentProps {
  /** Current [message object](https://getstream.io/chat/docs/#message_format) */
  message: Client.MessageResponse;
  /** Boolean if current message is part of thread */
  isThreadList: boolean;
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react-native/#channelcontext) */
  openThread?(message: Client.Message, event: React.SyntheticEvent): void;
  /** right | left */
  alignment?: 'right' | 'left';
}

export interface MessageStatusUIComponentProps extends StyledComponentProps {
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

export interface MessageAvatarUIComponentProps extends StyledComponentProps {
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
  extends MessageUIComponentProps,
    TranslationContextValue {
  alignment?: 'right' | 'left';
  /** Open the reaction picker */
  openReactionPicker?(): void;
  /** Dismiss the reaction picker */
  dismissReactionPicker?(): void;
  /** Boolean - if reaction picker is visible. Hides the reaction list in that case */
  reactionPickerVisible?: boolean;
}

export interface MessageTextContainerUIComponentProps
  extends StyledComponentProps {
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

export interface MessageTextProps extends StyledComponentProps {
  message: Client.MessageResponse;
}

export interface ThreadProps
  extends ChannelContextValue,
    TranslationContextValue,
    StyledComponentProps {
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

export interface TypingIndicatorProps
  extends StyledComponentProps,
    TranslationContextValue {
  typing: [];
  client: Client.StreamChat;
  Avatar?: React.ElementType<AvatarProps>;
}

export interface FileIconUIComponentProps extends StyledComponentProps {
  size: number;
  mimeType?: string;
}

export interface AutoCompleteInputProps
  extends StyledComponentProps,
    TranslationContextValue {
  value: string;
  openSuggestions?(title: string, component: React.ElementType<any>): void;
  closeSuggestions?(): void;
  updateSuggestions?(param: object): void;
  triggerSettings: object;
  setInputBoxRef?(ref: any): void;
  onChange?(text: string): void;
  additionalTextInputProps: object;
}

export interface CardProps extends StyledComponentProps {
  title?: string;
  title_link?: string;
  og_scrape_url?: string;
  image_url?: string;
  thumb_url?: string;
  text?: string;
  type?: string;
  alignment?: 'right' | 'left';
  onLongPress?: (event: GestureResponderEvent) => void;
  Header: React.ElementType<CardProps>;
  Cover: React.ElementType<CardProps>;
  Footer: React.ElementType<CardProps>;
}

export interface CommandsItemProps extends StyledComponentProps {
  name: string;
  args: string;
  description: string;
}
export interface FileAttachmentProps
  extends MessageContentContextValue,
    StyledComponentProps {
  /** The attachment to render */
  attachment: Client.Attachment;
  /**
      The handler function to call when an action is selected on an attachment.
      Examples include canceling a \/giphy command or shuffling the results.
      */
  actionHandler?(name: string, value: string): any;
  groupStyle: 'single' | 'top' | 'middle' | 'bottom';
  AttachmentFileIcon: React.ElementType<any>;
  alignment?: 'right' | 'left';
  onLongPress?: (event: GestureResponderEvent) => void;
}

export interface FileAttachmentGroupProps extends StyledComponentProps {
  messageId: string;
  files: [];
  handleAction?(): void;
  alignment?: 'right' | 'left';
  FileAttachment: React.ElementType<FileAttachmentProps>;
  AttachmentFileIcon: React.ElementType<any>;
}
export interface FileUploadPreviewProps extends StyledComponentProps {
  fileUploads: [];
  removeFile?(id: string): void;
  retryUpload?(id: string): Promise<any>;
  AttachmentFileIcon: React.ElementType<any>;
}
export interface GalleryProps
  extends StyledComponentProps,
    TranslationContextValue {
  images: Client.Attachment[];
  onLongPress: (event: GestureResponderEvent) => void;
  alignment?: 'right' | 'left';
}
export interface IconSquareProps extends StyledComponentProps {
  icon: string;
  onPress?(event: GestureResponderEvent): void;
}
export interface ImageUploadPreviewProps extends StyledComponentProps {
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
export interface KeyboardCompatibleViewProps extends StyledComponentProps {
  // Default: 500
  keyboardDismissAnimationDuration?: number;
  // Default: 500
  keyboardOpenAnimationDuration?: number;
  enabled?: boolean;
}

export interface EmptyStateIndicatorProps extends StyledComponentProps {
  listType?: listType;
}
export interface EventIndicatorProps extends StyledComponentProps {
  event:
    | Client.Event<Client.MemberAddedEvent>
    | Client.Event<Client.MemberRemovedEvent>
    | null;
}

export interface LoadingErrorIndicatorProps
  extends StyledComponentProps,
    TranslationContextValue {
  listType?: listType;
  retry?: () => void;
}
export interface LoadingIndicatorProps
  extends StyledComponentProps,
    TranslationContextValue {
  listType?: listType;
  loadingText?: string;
}
export interface MentionsItemProps
  extends StyledComponentProps,
    TranslationContextValue {
  item: {
    name?: string;
    image?: string;
    id: string;
  };
}

export interface MessageNotificationProps
  extends StyledComponentProps,
    TranslationContextValue {
  showNotification: boolean;
  onPress?(event: GestureResponderEvent): void;
}

export interface MessageSystemProps
  extends StyledComponentProps,
    TranslationContextValue {
  message: Client.MessageResponse;
}

export interface ReactionListProps extends StyledComponentProps {
  latestReactions: Client.ReactionResponse[];
  openReactionSelector?(event: GestureResponderEvent): void;
  getTotalReactionCount?(
    supportedReacions?: Array<{
      icon: string;
      id: string;
    }>,
  ): string | number;
  visible: boolean;
  position: string;
  supportedReactions?: Array<{
    icon: string;
    id: string;
  }>;
}

export interface ReactionPickerProps extends StyledComponentProps {
  hideReactionCount?: boolean;
  hideReactionOwners: boolean;
  reactionPickerVisible: boolean;
  handleDismiss?(): void;
  handleReaction?(id: string): void;
  latestReactions: Client.ReactionResponse[];
  reactionCounts: { [key: string]: number };
  rpLeft: string | number;
  rpTop: string | number;
  rpRight: string | number;
  supportedReactions?: Array<{
    icon: string;
    id: string;
  }>;
}

export interface ReactionPickerWrapperProps extends StyledComponentProps {
  isMyMessage?(message: Client.MessageResponse): boolean;
  message: Client.MessageResponse;
  hideReactionCount?: boolean;
  hideReactionOwners?: boolean;
  offset?: {
    top: string | number;
    left: string | number;
    right: string | number;
  };
  handleReaction?(id: string): void;
  supportedReactions?: Array<{
    icon: string;
    id: string;
  }>;
  /**
   * @deprecated
   * emojiData is deprecated. But going to keep it for now
   * to have backward compatibility. Please use supportedReactions instead.
   * TODO: Remove following prop in 1.x.x
   */
  emojiData?: Array<{
    icon: string;
    id: string;
  }>;
  dismissReactionPicker?(): void;
  reactionPickerVisible?: boolean;
  openReactionPicker?(): void;
}

export interface SpinnerProps extends StyledComponentProps {}

export interface SuggestionsProviderProps extends StyledComponentProps {
  active: boolean;
  marginLeft: string | number;
  width: string | number;
  suggestions: object;
  backdropHeight: string | number;
  handleDismiss?(event: GestureResponderEvent): void;
  suggestionsTitle: string;
}
export interface UploadProgressIndicatorProps extends StyledComponentProps {
  active: boolean;
  type: 'in_progress' | 'retry';
  action?(event: GestureResponderEvent): void;
}

export interface AttachmentActionsProps extends StyledComponentProps {
  text: string;
  actions: Client.Action[];
  actionHandler?(name: string, value: string): any;
}

export interface AttachButtonProps extends StyledComponentProps {
  handleOnPress(): void;
}

export interface SendButtonProps extends StyledComponentProps {
  title: string;
  editing: Client.MessageResponse | boolean;
  sendMessage(): void;
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
export class FileAttachment extends React.PureComponent<
  FileAttachmentProps,
  any
> {}
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

export class AttachButton extends React.PureComponent<AttachButtonProps, any> {}
export class SendButton extends React.PureComponent<SendButtonProps> {}
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
export class ChannelListHeaderErrorIndicator extends React.PureComponent<
  ChannelListHeaderErrorIndicatorProps,
  any
> {}
export class ChannelListHeaderNetworkDownIndicator extends React.PureComponent<
  ChannelListHeaderNetworkDownIndicatorProps,
  any
> {}
export class ChannelListFooterLoadingIndicator extends React.PureComponent<
  ChannelListFooterLoadingIndicatorProps,
  any
> {}

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

export interface Streami18nOptions {
  language: string;
  disableDateTimeTranslations?: boolean;
  translationsForLanguage?: object;
  debug?: boolean;
  logger?(msg: string): any;
  dayjsLocaleConfigForLanguage?: object;
  DateTimeParser?(): object;
  Moment?(): Object;
}

export interface Streami18nTranslators {
  t: i18next.TFunction;
  tDateTimeParser?(datetime?: string | number): object;
}

export class Streami18n {
  constructor(options?: Streami18nOptions);

  init(): Promise<Streami18nTranslators>;
  validateCurrentLanguage(): void;
  geti18Instance(): i18next.i18n;
  getAvailableLanguages(): Array<string>;
  getTranslations(): Array<string>;
  getTranslators(): Promise<Streami18nTranslators>;
  registerTranslation(
    key: string,
    translation: object,
    customDayjsLocale?: Partial<ILocale>,
  ): void;
  addOrUpdateLocale(key: string, config: Partial<ILocale>): void;
  setLanguage(language: string): Promise<void>;
  localeExists(language: string): boolean;
  registerSetLanguageCallback(callback: (t: i18next.TFunction) => void): void;
}

export const enTranslations: object;
export const nlTranslations: object;
export const ruTranslations: object;
export const trTranslations: object;
export const frTranslations: object;
export const hiTranslations: object;
export const itTranslations: object;
