import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingViewProps, StyleSheet, Text, View } from 'react-native';

import debounce from 'lodash/debounce';
import omit from 'lodash/omit';
import throttle from 'lodash/throttle';

import { lookup } from 'mime-types';
import {
  Channel as ChannelClass,
  ChannelState,
  Channel as ChannelType,
  EventHandler,
  FormatMessageResponse,
  MessageResponse,
  Reaction,
  SendMessageAPIResponse,
  StreamChat,
  Event as StreamEvent,
  Message as StreamMessage,
  Thread,
} from 'stream-chat';

import { useChannelDataState } from './hooks/useChannelDataState';
import { useCreateChannelContext } from './hooks/useCreateChannelContext';

import { useCreateInputMessageInputContext } from './hooks/useCreateInputMessageInputContext';

import { useCreateMessagesContext } from './hooks/useCreateMessagesContext';

import { useCreateOwnCapabilitiesContext } from './hooks/useCreateOwnCapabilitiesContext';
import { useCreatePaginatedMessageListContext } from './hooks/useCreatePaginatedMessageListContext';

import { useCreateThreadContext } from './hooks/useCreateThreadContext';

import { useCreateTypingContext } from './hooks/useCreateTypingContext';

import { useMessageListPagination } from './hooks/useMessageListPagination';
import { useTargetedMessage } from './hooks/useTargetedMessage';

import { MessageContextValue } from '../../contexts';
import { ChannelContextValue, ChannelProvider } from '../../contexts/channelContext/ChannelContext';
import type { UseChannelStateValue } from '../../contexts/channelsStateContext/useChannelState';
import { useChannelState } from '../../contexts/channelsStateContext/useChannelState';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  InputMessageInputContextValue,
  MessageInputProvider,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesContextValue,
  MessagesProvider,
} from '../../contexts/messagesContext/MessagesContext';
import {
  OwnCapabilitiesContextValue,
  OwnCapabilitiesProvider,
} from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import {
  PaginatedMessageListContextValue,
  PaginatedMessageListProvider,
} from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import {
  SuggestionsContextValue,
  SuggestionsProvider,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  ThreadContextValue,
  ThreadProvider,
  ThreadType,
} from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { TypingProvider } from '../../contexts/typingContext/TypingContext';
import { useAppStateListener } from '../../hooks/useAppStateListener';

import {
  LOLReaction,
  LoveReaction,
  ThumbsDownReaction,
  ThumbsUpReaction,
  WutReaction,
} from '../../icons';
import {
  isDocumentPickerAvailable,
  isImageMediaLibraryAvailable,
  isImagePickerAvailable,
  NativeHandlers,
} from '../../native';
import * as dbApi from '../../store/apis';
import { ChannelUnreadState, DefaultStreamChatGenerics, FileTypes } from '../../types/types';
import { addReactionToLocalState } from '../../utils/addReactionToLocalState';
import { compressedImageURI } from '../../utils/compressImage';
import { DBSyncManager } from '../../utils/DBSyncManager';
import { patchMessageTextCommand } from '../../utils/patchMessageTextCommand';
import { removeReactionFromLocalState } from '../../utils/removeReactionFromLocalState';
import { removeReservedFields } from '../../utils/removeReservedFields';
import {
  defaultEmojiSearchIndex,
  generateRandomId,
  getFileNameFromPath,
  isBouncedMessage,
  isLocalUrl,
  MessageStatusTypes,
  ReactionData,
} from '../../utils/utils';
import { Attachment as AttachmentDefault } from '../Attachment/Attachment';
import { AttachmentActions as AttachmentActionsDefault } from '../Attachment/AttachmentActions';
import { AudioAttachment as AudioAttachmentDefault } from '../Attachment/AudioAttachment';
import { Card as CardDefault } from '../Attachment/Card';
import { FileAttachment as FileAttachmentDefault } from '../Attachment/FileAttachment';
import { FileAttachmentGroup as FileAttachmentGroupDefault } from '../Attachment/FileAttachmentGroup';
import { FileIcon as FileIconDefault } from '../Attachment/FileIcon';
import { Gallery as GalleryDefault } from '../Attachment/Gallery';
import { Giphy as GiphyDefault } from '../Attachment/Giphy';
import { ImageLoadingFailedIndicator as ImageLoadingFailedIndicatorDefault } from '../Attachment/ImageLoadingFailedIndicator';
import { ImageLoadingIndicator as ImageLoadingIndicatorDefault } from '../Attachment/ImageLoadingIndicator';
import { VideoThumbnail as VideoThumbnailDefault } from '../Attachment/VideoThumbnail';
import { AutoCompleteSuggestionHeader as AutoCompleteSuggestionHeaderDefault } from '../AutoCompleteInput/AutoCompleteSuggestionHeader';
import { AutoCompleteSuggestionItem as AutoCompleteSuggestionItemDefault } from '../AutoCompleteInput/AutoCompleteSuggestionItem';
import { AutoCompleteSuggestionList as AutoCompleteSuggestionListDefault } from '../AutoCompleteInput/AutoCompleteSuggestionList';
import { EmptyStateIndicator as EmptyStateIndicatorDefault } from '../Indicators/EmptyStateIndicator';
import {
  LoadingErrorIndicator as LoadingErrorIndicatorDefault,
  LoadingErrorProps,
} from '../Indicators/LoadingErrorIndicator';
import { LoadingIndicator as LoadingIndicatorDefault } from '../Indicators/LoadingIndicator';
import { KeyboardCompatibleView as KeyboardCompatibleViewDefault } from '../KeyboardCompatibleView/KeyboardCompatibleView';
import { Message as MessageDefault } from '../Message/Message';
import { MessageAvatar as MessageAvatarDefault } from '../Message/MessageSimple/MessageAvatar';
import { MessageBounce as MessageBounceDefault } from '../Message/MessageSimple/MessageBounce';
import { MessageContent as MessageContentDefault } from '../Message/MessageSimple/MessageContent';
import { MessageDeleted as MessageDeletedDefault } from '../Message/MessageSimple/MessageDeleted';
import { MessageEditedTimestamp as MessageEditedTimestampDefault } from '../Message/MessageSimple/MessageEditedTimestamp';
import { MessageError as MessageErrorDefault } from '../Message/MessageSimple/MessageError';
import { MessageFooter as MessageFooterDefault } from '../Message/MessageSimple/MessageFooter';
import { MessagePinnedHeader as MessagePinnedHeaderDefault } from '../Message/MessageSimple/MessagePinnedHeader';
import { MessageReplies as MessageRepliesDefault } from '../Message/MessageSimple/MessageReplies';
import { MessageRepliesAvatars as MessageRepliesAvatarsDefault } from '../Message/MessageSimple/MessageRepliesAvatars';
import { MessageSimple as MessageSimpleDefault } from '../Message/MessageSimple/MessageSimple';
import { MessageStatus as MessageStatusDefault } from '../Message/MessageSimple/MessageStatus';
import { MessageSwipeContent as MessageSwipeContentDefault } from '../Message/MessageSimple/MessageSwipeContent';
import { MessageTimestamp as MessageTimestampDefault } from '../Message/MessageSimple/MessageTimestamp';
import { ReactionListBottom as ReactionListBottomDefault } from '../Message/MessageSimple/ReactionList/ReactionListBottom';
import { ReactionListTop as ReactionListTopDefault } from '../Message/MessageSimple/ReactionList/ReactionListTop';
import { StreamingMessageView as DefaultStreamingMessageView } from '../Message/MessageSimple/StreamingMessageView';
import { AttachButton as AttachButtonDefault } from '../MessageInput/AttachButton';
import { CommandsButton as CommandsButtonDefault } from '../MessageInput/CommandsButton';
import { AudioRecorder as AudioRecorderDefault } from '../MessageInput/components/AudioRecorder/AudioRecorder';
import { AudioRecordingButton as AudioRecordingButtonDefault } from '../MessageInput/components/AudioRecorder/AudioRecordingButton';
import { AudioRecordingInProgress as AudioRecordingInProgressDefault } from '../MessageInput/components/AudioRecorder/AudioRecordingInProgress';
import { AudioRecordingLockIndicator as AudioRecordingLockIndicatorDefault } from '../MessageInput/components/AudioRecorder/AudioRecordingLockIndicator';
import { AudioRecordingPreview as AudioRecordingPreviewDefault } from '../MessageInput/components/AudioRecorder/AudioRecordingPreview';
import { AudioRecordingWaveform as AudioRecordingWaveformDefault } from '../MessageInput/components/AudioRecorder/AudioRecordingWaveform';
import { InputEditingStateHeader as InputEditingStateHeaderDefault } from '../MessageInput/components/InputEditingStateHeader';
import { InputGiphySearch as InputGiphyCommandInputDefault } from '../MessageInput/components/InputGiphySearch';
import { InputReplyStateHeader as InputReplyStateHeaderDefault } from '../MessageInput/components/InputReplyStateHeader';
import { CooldownTimer as CooldownTimerDefault } from '../MessageInput/CooldownTimer';
import { FileUploadPreview as FileUploadPreviewDefault } from '../MessageInput/FileUploadPreview';
import { ImageUploadPreview as ImageUploadPreviewDefault } from '../MessageInput/ImageUploadPreview';
import { InputButtons as InputButtonsDefault } from '../MessageInput/InputButtons';
import { MoreOptionsButton as MoreOptionsButtonDefault } from '../MessageInput/MoreOptionsButton';
import { SendButton as SendButtonDefault } from '../MessageInput/SendButton';
import { SendMessageDisallowedIndicator as SendMessageDisallowedIndicatorDefault } from '../MessageInput/SendMessageDisallowedIndicator';
import { ShowThreadMessageInChannelButton as ShowThreadMessageInChannelButtonDefault } from '../MessageInput/ShowThreadMessageInChannelButton';
import { StopMessageStreamingButton as DefaultStopMessageStreamingButton } from '../MessageInput/StopMessageStreamingButton';
import { UploadProgressIndicator as UploadProgressIndicatorDefault } from '../MessageInput/UploadProgressIndicator';
import { DateHeader as DateHeaderDefault } from '../MessageList/DateHeader';
import type { MessageType } from '../MessageList/hooks/useMessageList';
import { InlineDateSeparator as InlineDateSeparatorDefault } from '../MessageList/InlineDateSeparator';
import { InlineUnreadIndicator as InlineUnreadIndicatorDefault } from '../MessageList/InlineUnreadIndicator';
import { MessageList as MessageListDefault } from '../MessageList/MessageList';
import { MessageSystem as MessageSystemDefault } from '../MessageList/MessageSystem';
import { NetworkDownIndicator as NetworkDownIndicatorDefault } from '../MessageList/NetworkDownIndicator';
import { ScrollToBottomButton as ScrollToBottomButtonDefault } from '../MessageList/ScrollToBottomButton';
import { StickyHeader as StickyHeaderDefault } from '../MessageList/StickyHeader';
import { TypingIndicator as TypingIndicatorDefault } from '../MessageList/TypingIndicator';
import { TypingIndicatorContainer as TypingIndicatorContainerDefault } from '../MessageList/TypingIndicatorContainer';
import { UnreadMessagesNotification as UnreadMessagesNotificationDefault } from '../MessageList/UnreadMessagesNotification';
import { MessageActionList as MessageActionListDefault } from '../MessageMenu/MessageActionList';
import { MessageActionListItem as MessageActionListItemDefault } from '../MessageMenu/MessageActionListItem';
import { MessageMenu as MessageMenuDefault } from '../MessageMenu/MessageMenu';
import { MessageReactionPicker as MessageReactionPickerDefault } from '../MessageMenu/MessageReactionPicker';
import { MessageUserReactions as MessageUserReactionsDefault } from '../MessageMenu/MessageUserReactions';
import { MessageUserReactionsAvatar as MessageUserReactionsAvatarDefault } from '../MessageMenu/MessageUserReactionsAvatar';
import { MessageUserReactionsItem as MessageUserReactionsItemDefault } from '../MessageMenu/MessageUserReactionsItem';
import { Reply as ReplyDefault } from '../Reply/Reply';

export type MarkReadFunctionOptions = {
  /**
   * Signal, whether the `channelUnreadUiState` should be updated.
   * By default, the local state update is prevented when the Channel component is mounted.
   * This is in order to keep the UI indicating the original unread state, when the user opens a channel.
   */
  updateChannelUnreadState?: boolean;
};

const styles = StyleSheet.create({
  selectChannel: { fontWeight: 'bold', padding: 16 },
});

export const reactionData: ReactionData[] = [
  {
    Icon: LoveReaction,
    type: 'love',
  },
  {
    Icon: ThumbsUpReaction,
    type: 'like',
  },
  {
    Icon: ThumbsDownReaction,
    type: 'sad',
  },
  {
    Icon: LOLReaction,
    type: 'haha',
  },
  {
    Icon: WutReaction,
    type: 'wow',
  },
];

/**
 * If count of unread messages is less than 4, then no need to scroll to first unread message,
 * since first unread message will be in visible frame anyways.
 */
const scrollToFirstUnreadThreshold = 0;

const defaultThrottleInterval = 500;
const defaultDebounceInterval = 500;
const throttleOptions = {
  leading: true,
  trailing: true,
};

const debounceOptions = {
  leading: true,
  trailing: true,
};

export type ChannelPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<ChannelContextValue<StreamChatGenerics>, 'channel'> &
  Partial<
    Pick<
      ChannelContextValue<StreamChatGenerics>,
      | 'EmptyStateIndicator'
      | 'enableMessageGroupingByUser'
      | 'enforceUniqueReaction'
      | 'giphyEnabled'
      | 'hideStickyDateHeader'
      | 'hideDateSeparators'
      | 'LoadingIndicator'
      | 'maxTimeBetweenGroupedMessages'
      | 'NetworkDownIndicator'
      | 'StickyHeader'
    >
  > &
  Pick<ChatContextValue<StreamChatGenerics>, 'client' | 'enableOfflineSupport'> &
  Partial<
    Omit<
      InputMessageInputContextValue<StreamChatGenerics>,
      'quotedMessage' | 'editing' | 'clearEditingState' | 'clearQuotedMessageState' | 'sendMessage'
    >
  > &
  Partial<
    Pick<
      SuggestionsContextValue<StreamChatGenerics>,
      'AutoCompleteSuggestionHeader' | 'AutoCompleteSuggestionItem' | 'AutoCompleteSuggestionList'
    >
  > &
  Pick<TranslationContextValue, 't'> &
  Partial<
    Pick<
      PaginatedMessageListContextValue<StreamChatGenerics>,
      'messages' | 'loadingMore' | 'loadingMoreRecent'
    >
  > &
  Pick<UseChannelStateValue<StreamChatGenerics>, 'threadMessages' | 'setThreadMessages'> &
  Partial<
    Pick<
      MessagesContextValue<StreamChatGenerics>,
      | 'additionalPressableProps'
      | 'Attachment'
      | 'AttachmentActions'
      | 'AudioAttachment'
      | 'Card'
      | 'CardCover'
      | 'CardFooter'
      | 'CardHeader'
      | 'DateHeader'
      | 'deletedMessagesVisibilityType'
      | 'disableTypingIndicator'
      | 'dismissKeyboardOnMessageTouch'
      | 'enableSwipeToReply'
      | 'FileAttachment'
      | 'FileAttachmentIcon'
      | 'FileAttachmentGroup'
      | 'FlatList'
      | 'forceAlignMessages'
      | 'Gallery'
      | 'getMessagesGroupStyles'
      | 'Giphy'
      | 'giphyVersion'
      | 'handleBan'
      | 'handleCopy'
      | 'handleDelete'
      | 'handleEdit'
      | 'handleFlag'
      | 'handleMarkUnread'
      | 'handleMute'
      | 'handlePinMessage'
      | 'handleReaction'
      | 'handleQuotedReply'
      | 'handleRetry'
      | 'handleThreadReply'
      | 'InlineDateSeparator'
      | 'InlineUnreadIndicator'
      | 'isAttachmentEqual'
      | 'legacyImageViewerSwipeBehaviour'
      | 'ImageLoadingFailedIndicator'
      | 'ImageLoadingIndicator'
      | 'markdownRules'
      | 'Message'
      | 'MessageActionList'
      | 'MessageActionListItem'
      | 'messageActions'
      | 'MessageAvatar'
      | 'MessageBounce'
      | 'MessageContent'
      | 'messageContentOrder'
      | 'MessageDeleted'
      | 'MessageEditedTimestamp'
      | 'MessageError'
      | 'MessageFooter'
      | 'MessageHeader'
      | 'MessageList'
      | 'MessageMenu'
      | 'MessagePinnedHeader'
      | 'MessageReplies'
      | 'MessageRepliesAvatars'
      | 'MessageSimple'
      | 'MessageStatus'
      | 'MessageSystem'
      | 'MessageText'
      | 'messageTextNumberOfLines'
      | 'MessageTimestamp'
      | 'MessageUserReactions'
      | 'MessageSwipeContent'
      | 'messageSwipeToReplyHitSlop'
      | 'myMessageTheme'
      | 'onLongPressMessage'
      | 'onPressInMessage'
      | 'onPressMessage'
      | 'MessageReactionPicker'
      | 'MessageUserReactionsAvatar'
      | 'MessageUserReactionsItem'
      | 'ReactionListBottom'
      | 'reactionListPosition'
      | 'ReactionListTop'
      | 'Reply'
      | 'shouldShowUnreadUnderlay'
      | 'ScrollToBottomButton'
      | 'selectReaction'
      | 'supportedReactions'
      | 'TypingIndicator'
      | 'TypingIndicatorContainer'
      | 'UrlPreview'
      | 'VideoThumbnail'
      | 'PollContent'
      | 'hasCreatePoll'
      | 'UnreadMessagesNotification'
      | 'StreamingMessageView'
    >
  > &
  Partial<Pick<MessageContextValue<StreamChatGenerics>, 'isMessageAIGenerated'>> &
  Partial<Pick<ThreadContextValue<StreamChatGenerics>, 'allowThreadMessagesInChannel'>> & {
    shouldSyncChannel: boolean;
    thread: ThreadType<StreamChatGenerics>;
    /**
     * Additional props passed to keyboard avoiding view
     */
    additionalKeyboardAvoidingViewProps?: Partial<KeyboardAvoidingViewProps>;
    /**
     * When true, disables the KeyboardCompatibleView wrapper
     *
     * Channel internally uses the [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx)
     * component to adjust the height of Channel when the keyboard is opened or dismissed. This prop provides the ability to disable this functionality in case you
     * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or handle dismissal yourself.
     * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
     */
    disableKeyboardCompatibleView?: boolean;
    /**
     * Overrides the Stream default mark channel read request (Advanced usage only)
     * @param channel Channel object
     */
    doMarkReadRequest?: (
      channel: ChannelType<StreamChatGenerics>,
      setChannelUnreadUiState?: (state: ChannelUnreadState) => void,
    ) => void;
    /**
     * Overrides the Stream default send message request (Advanced usage only)
     * @param channelId
     * @param messageData Message object
     */
    doSendMessageRequest?: (
      channelId: string,
      messageData: StreamMessage<StreamChatGenerics>,
    ) => Promise<SendMessageAPIResponse<StreamChatGenerics>>;
    /**
     * Overrides the Stream default update message request (Advanced usage only)
     * @param channelId
     * @param updatedMessage UpdatedMessage object
     */
    doUpdateMessageRequest?: (
      channelId: string,
      updatedMessage: Parameters<StreamChat<StreamChatGenerics>['updateMessage']>[0],
    ) => ReturnType<StreamChat<StreamChatGenerics>['updateMessage']>;
    /**
     * When true, messageList will be scrolled at first unread message, when opened.
     */
    initialScrollToFirstUnreadMessage?: boolean;
    keyboardBehavior?: KeyboardAvoidingViewProps['behavior'];
    /**
     * Custom wrapper component that handles height adjustment of Channel component when keyboard is opened or dismissed
     * Default component (accepts the same props): [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx)
     *
     * **Example:**
     *
     * ```
     * <Channel
     *  channel={channel}
     *  KeyboardCompatibleView={(props) => {
     *    return (
     *      <KeyboardCompatibleView>
     *        {props.children}
     *      </KeyboardCompatibleView>
     *    )
     *  }}
     * />
     * ```
     */
    KeyboardCompatibleView?: React.ComponentType<KeyboardAvoidingViewProps>;
    keyboardVerticalOffset?: number;
    /**
     * Custom loading error indicator to override the Stream default
     */
    LoadingErrorIndicator?: React.ComponentType<LoadingErrorProps>;
    /**
     * Boolean flag to enable/disable marking the channel as read on mount
     */
    markReadOnMount?: boolean;
    maxMessageLength?: number;
    /**
     * Load the channel at a specified message instead of the most recent message.
     */
    messageId?: string;
    /**
     * @deprecated
     * The time interval for throttling while updating the message state
     */
    newMessageStateUpdateThrottleInterval?: number;
    overrideOwnCapabilities?: Partial<OwnCapabilitiesContextValue>;
    stateUpdateThrottleInterval?: number;
    /**
     * Tells if channel is rendering a thread list
     */
    threadList?: boolean;
  } & Partial<
    Pick<
      InputMessageInputContextValue,
      'openPollCreationDialog' | 'CreatePollContent' | 'StopMessageStreamingButton'
    >
  >;

const ChannelWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<ChannelPropsWithContext<StreamChatGenerics>>,
) => {
  const {
    additionalKeyboardAvoidingViewProps,
    additionalPressableProps,
    additionalTextInputProps,
    allowThreadMessagesInChannel = true,
    asyncMessagesLockDistance = 50,
    asyncMessagesMinimumPressDuration = 500,
    asyncMessagesMultiSendEnabled = true,
    asyncMessagesSlideToCancelDistance = 100,
    AttachButton = AttachButtonDefault,
    Attachment = AttachmentDefault,
    AttachmentActions = AttachmentActionsDefault,
    AudioAttachment = AudioAttachmentDefault,
    AudioAttachmentUploadPreview = AudioAttachmentDefault,
    AudioRecorder = AudioRecorderDefault,
    audioRecordingEnabled = false,
    AudioRecordingInProgress = AudioRecordingInProgressDefault,
    AudioRecordingLockIndicator = AudioRecordingLockIndicatorDefault,
    AudioRecordingPreview = AudioRecordingPreviewDefault,
    AudioRecordingWaveform = AudioRecordingWaveformDefault,
    AutoCompleteSuggestionHeader = AutoCompleteSuggestionHeaderDefault,
    AutoCompleteSuggestionItem = AutoCompleteSuggestionItemDefault,
    AutoCompleteSuggestionList = AutoCompleteSuggestionListDefault,
    autoCompleteSuggestionsLimit,
    autoCompleteTriggerSettings,
    Card = CardDefault,
    CardCover,
    CardFooter,
    CardHeader,
    channel,
    children,
    client,
    CommandsButton = CommandsButtonDefault,
    compressImageQuality,
    CooldownTimer = CooldownTimerDefault,
    CreatePollContent,
    DateHeader = DateHeaderDefault,
    deletedMessagesVisibilityType = 'always',
    disableKeyboardCompatibleView = false,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch = true,
    doDocUploadRequest,
    doImageUploadRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
    emojiSearchIndex = defaultEmojiSearchIndex,
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    enableMessageGroupingByUser = true,
    enableOfflineSupport,
    enableSwipeToReply = true,
    enforceUniqueReaction = false,
    FileAttachment = FileAttachmentDefault,
    FileAttachmentGroup = FileAttachmentGroupDefault,
    FileAttachmentIcon = FileIconDefault,
    FileUploadPreview = FileUploadPreviewDefault,
    FlatList = NativeHandlers.FlatList,
    forceAlignMessages,
    Gallery = GalleryDefault,
    getMessagesGroupStyles,
    Giphy = GiphyDefault,
    giphyEnabled,
    giphyVersion = 'fixed_height',
    handleAttachButtonPress,
    handleBan,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    hasCameraPicker = isImagePickerAvailable(),
    hasCommands = true,
    hasCreatePoll,
    // If pickDocument isn't available, default to hiding the file picker
    hasFilePicker = isDocumentPickerAvailable(),
    hasImagePicker = isImagePickerAvailable() || isImageMediaLibraryAvailable(),
    hideDateSeparators = false,
    hideStickyDateHeader = false,
    ImageLoadingFailedIndicator = ImageLoadingFailedIndicatorDefault,
    ImageLoadingIndicator = ImageLoadingIndicatorDefault,
    ImageUploadPreview = ImageUploadPreviewDefault,
    initialScrollToFirstUnreadMessage = false,
    initialValue,
    InlineDateSeparator = InlineDateSeparatorDefault,
    InlineUnreadIndicator = InlineUnreadIndicatorDefault,
    Input,
    InputButtons = InputButtonsDefault,
    InputEditingStateHeader = InputEditingStateHeaderDefault,
    InputGiphySearch = InputGiphyCommandInputDefault,
    InputReplyStateHeader = InputReplyStateHeaderDefault,
    isAttachmentEqual,
    isMessageAIGenerated = () => false,
    keyboardBehavior,
    KeyboardCompatibleView = KeyboardCompatibleViewDefault,
    keyboardVerticalOffset,
    legacyImageViewerSwipeBehaviour = false,
    LoadingErrorIndicator = LoadingErrorIndicatorDefault,
    LoadingIndicator = LoadingIndicatorDefault,
    loadingMore: loadingMoreProp,
    loadingMoreRecent: loadingMoreRecentProp,
    markdownRules,
    markReadOnMount = true,
    maxMessageLength: maxMessageLengthProp,
    maxNumberOfFiles = 10,
    maxTimeBetweenGroupedMessages,
    mentionAllAppUsersEnabled = false,
    mentionAllAppUsersQuery,
    Message = MessageDefault,
    MessageActionList = MessageActionListDefault,
    MessageActionListItem = MessageActionListItemDefault,
    messageActions,
    MessageAvatar = MessageAvatarDefault,
    MessageBounce = MessageBounceDefault,
    MessageContent = MessageContentDefault,
    messageContentOrder = [
      'quoted_reply',
      'gallery',
      'files',
      'poll',
      'ai_text',
      'text',
      'attachments',
    ],
    MessageDeleted = MessageDeletedDefault,
    MessageEditedTimestamp = MessageEditedTimestampDefault,
    MessageError = MessageErrorDefault,
    MessageFooter = MessageFooterDefault,
    MessageHeader,
    messageId,
    MessageList = MessageListDefault,
    MessageMenu = MessageMenuDefault,
    MessagePinnedHeader = MessagePinnedHeaderDefault,
    MessageReactionPicker = MessageReactionPickerDefault,
    MessageReplies = MessageRepliesDefault,
    MessageRepliesAvatars = MessageRepliesAvatarsDefault,
    MessageSimple = MessageSimpleDefault,
    MessageStatus = MessageStatusDefault,
    MessageSwipeContent = MessageSwipeContentDefault,
    messageSwipeToReplyHitSlop,
    MessageSystem = MessageSystemDefault,
    MessageText,
    messageTextNumberOfLines,
    MessageTimestamp = MessageTimestampDefault,
    MessageUserReactions = MessageUserReactionsDefault,
    MessageUserReactionsAvatar = MessageUserReactionsAvatarDefault,
    MessageUserReactionsItem = MessageUserReactionsItemDefault,
    MoreOptionsButton = MoreOptionsButtonDefault,
    myMessageTheme,
    NetworkDownIndicator = NetworkDownIndicatorDefault,
    // TODO: Think about this one
    newMessageStateUpdateThrottleInterval = defaultThrottleInterval,
    numberOfLines = 5,
    onChangeText,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    openPollCreationDialog,
    overrideOwnCapabilities,
    PollContent,
    ReactionListBottom = ReactionListBottomDefault,
    reactionListPosition = 'top',
    ReactionListTop = ReactionListTopDefault,
    Reply = ReplyDefault,
    ScrollToBottomButton = ScrollToBottomButtonDefault,
    selectReaction,
    SendButton = SendButtonDefault,
    sendImageAsync = false,
    SendMessageDisallowedIndicator = SendMessageDisallowedIndicatorDefault,
    setInputRef,
    setThreadMessages,
    shouldShowUnreadUnderlay = true,
    shouldSyncChannel,
    ShowThreadMessageInChannelButton = ShowThreadMessageInChannelButtonDefault,
    StartAudioRecordingButton = AudioRecordingButtonDefault,
    stateUpdateThrottleInterval = defaultThrottleInterval,
    StickyHeader = StickyHeaderDefault,
    StopMessageStreamingButton: StopMessageStreamingButtonOverride,
    StreamingMessageView = DefaultStreamingMessageView,
    supportedReactions = reactionData,
    t,
    thread: threadFromProps,
    threadList,
    threadMessages,
    TypingIndicator = TypingIndicatorDefault,
    TypingIndicatorContainer = TypingIndicatorContainerDefault,
    UnreadMessagesNotification = UnreadMessagesNotificationDefault,
    UploadProgressIndicator = UploadProgressIndicatorDefault,
    UrlPreview = CardDefault,
    VideoThumbnail = VideoThumbnailDefault,
  } = props;

  const { thread: threadProps, threadInstance } = threadFromProps;
  const StopMessageStreamingButton =
    StopMessageStreamingButtonOverride === undefined
      ? DefaultStopMessageStreamingButton
      : StopMessageStreamingButtonOverride;

  const {
    theme: {
      channel: { selectChannel },
      colors: { black },
    },
  } = useTheme();
  const [deleted, setDeleted] = useState<boolean>(false);
  const [editing, setEditing] = useState<MessageType<StreamChatGenerics> | undefined>(undefined);
  const [error, setError] = useState<Error | boolean>(false);
  const [lastRead, setLastRead] = useState<ChannelContextValue<StreamChatGenerics>['lastRead']>();
  const [quotedMessage, setQuotedMessage] = useState<MessageType<StreamChatGenerics> | undefined>(
    undefined,
  );
  const [thread, setThread] = useState<MessageType<StreamChatGenerics> | null>(threadProps || null);
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);
  const [channelUnreadState, setChannelUnreadState] = useState<ChannelUnreadState | undefined>(
    undefined,
  );

  const syncingChannelRef = useRef(false);

  const { highlightedMessageId, setTargetedMessage, targetedMessage } = useTargetedMessage();

  /**
   * This ref will hold the abort controllers for
   * requests made for uploading images/files in the messageInputContext
   * Its a map of filename to AbortController
   */
  const uploadAbortControllerRef = useRef<Map<string, AbortController>>(new Map());

  const channelId = channel?.id || '';
  const pollCreationEnabled = !channel.disconnected && !!channel?.id && channel?.getConfig()?.polls;

  const {
    copyStateFromChannel,
    initStateFromChannel,
    setRead,
    setTyping,
    state: channelState,
  } = useChannelDataState<StreamChatGenerics>(channel);

  const {
    copyMessagesStateFromChannel,
    loadChannelAroundMessage: loadChannelAroundMessageFn,
    loadChannelAtFirstUnreadMessage,
    loadInitialMessagesStateFromChannel,
    loadLatestMessages,
    loadMore,
    loadMoreRecent,
    state: channelMessagesState,
  } = useMessageListPagination<StreamChatGenerics>({
    channel,
  });

  /**
   * Since we copy the current channel state all together, we need to find the greatest time among the below two and apply it as the throttling time for copying the channel state.
   * This is done until we remove the newMessageStateUpdateThrottleInterval prop.
   */
  const copyChannelStateThrottlingTime =
    newMessageStateUpdateThrottleInterval > stateUpdateThrottleInterval
      ? newMessageStateUpdateThrottleInterval
      : stateUpdateThrottleInterval;

  const copyChannelState = useMemo(
    () =>
      throttle(
        () => {
          if (channel) {
            copyStateFromChannel(channel);
            copyMessagesStateFromChannel(channel);
          }
        },
        copyChannelStateThrottlingTime,
        throttleOptions,
      ),
    [channel, copyChannelStateThrottlingTime, copyMessagesStateFromChannel, copyStateFromChannel],
  );

  const handleEvent: EventHandler<StreamChatGenerics> = (event) => {
    if (shouldSyncChannel) {
      /**
       * Ignore user.watching.start and user.watching.stop as we should not copy the entire state when
       * they occur. Also ignore all poll related events since they're being handled in their own
       * reactive state and have no business having an effect on the Channel component.
       */
      if (
        event.type.startsWith('poll.') ||
        event.type === 'user.watching.start' ||
        event.type === 'user.watching.stop'
      ) {
        return;
      }

      // If the event is typing.start or typing.stop, set the typing state
      const isTypingEvent = event.type === 'typing.start' || event.type === 'typing.stop';
      if (isTypingEvent) {
        setTyping(channel);
      } else {
        if (thread?.id) {
          const updatedThreadMessages =
            (thread.id && channel && channel.state.threads[thread.id]) || threadMessages;
          setThreadMessages(updatedThreadMessages);

          if (channel && event.message?.id === thread.id && !threadInstance) {
            const updatedThread = channel.state.formatMessage(event.message);
            setThread(updatedThread);
          }
        }
      }

      if (event.type === 'notification.mark_unread') {
        setChannelUnreadState((prev) => {
          if (!(event.last_read_at && event.user)) {
            return prev;
          }
          return {
            first_unread_message_id: event.first_unread_message_id,
            last_read: new Date(event.last_read_at),
            last_read_message_id: event.last_read_message_id,
            unread_messages: event.unread_messages ?? 0,
          };
        });
      }

      if (event.type === 'channel.truncated' && event.cid === channel.cid) {
        setChannelUnreadState(undefined);
      }

      // only update channel state if the events are not the previously subscribed useEffect's subscription events
      if (channel && channel.initialized) {
        copyChannelState();
      }
    }
  };

  useEffect(() => {
    let listener: ReturnType<typeof channel.on>;
    const initChannel = async () => {
      setLastRead(new Date());
      const unreadCount = channel.countUnread();
      if (!channel || !shouldSyncChannel || channel.offlineMode) {
        return;
      }
      let errored = false;

      if (!channel.initialized || !channel.state.isUpToDate) {
        try {
          await channel?.watch();
        } catch (err) {
          console.warn('Channel watch request failed with error:', err);
          setError(true);
          errored = true;
        }
      }

      if (!errored) {
        initStateFromChannel(channel);
        loadInitialMessagesStateFromChannel(channel, channel.state.messagePagination.hasPrev);
      }

      if (client.user?.id && channel.state.read[client.user.id]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, ...ownReadState } = channel.state.read[client.user.id];
        setChannelUnreadState(ownReadState);
      }

      if (messageId) {
        await loadChannelAroundMessage({ messageId, setTargetedMessage });
      } else if (
        initialScrollToFirstUnreadMessage &&
        client.user &&
        unreadCount > scrollToFirstUnreadThreshold
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user, ...ownReadState } = channel.state.read[client.user.id];

        await loadChannelAtFirstUnreadMessage({
          channelUnreadState: ownReadState,
          setChannelUnreadState,
          setTargetedMessage,
        });
      }

      if (unreadCount > 0 && markReadOnMount) {
        await markRead({ updateChannelUnreadState: false });
      }

      listener = channel.on(handleEvent);
    };

    initChannel();

    return () => {
      copyChannelState.cancel();
      loadMoreThreadFinished.cancel();
      listener?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel.cid, messageId, shouldSyncChannel]);

  // subscribe to channel.deleted event
  useEffect(() => {
    const { unsubscribe } = client.on('channel.deleted', (event) => {
      if (event.cid === channel?.cid) {
        setDeleted(true);
      }
    });

    return unsubscribe;
  }, [channel?.cid, client]);

  /**
   * Subscription to the Notification mark_read event.
   */
  useEffect(() => {
    const handleEvent: EventHandler<StreamChatGenerics> = (event) => {
      if (channel.cid === event.cid) {
        setRead(channel);
      }
    };

    const { unsubscribe } = client.on('notification.mark_read', handleEvent);
    return unsubscribe;
  }, [channel, client, setRead]);

  const threadPropsExists = !!threadProps;

  useEffect(() => {
    if (threadProps && shouldSyncChannel) {
      setThread(threadProps);
      if (channel && threadProps?.id) {
        setThreadMessages(channel.state.threads?.[threadProps.id] || []);
      }
    } else {
      setThread(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadPropsExists, shouldSyncChannel]);

  const handleAppBackground = useCallback(() => {
    const channelData = channel.data as
      | Extract<typeof channel.data, { own_capabilities: string[] }>
      | undefined;
    if (channelData?.own_capabilities?.includes('send-typing-events')) {
      channel.sendEvent({
        parent_id: thread?.id,
        type: 'typing.stop',
      } as StreamEvent<StreamChatGenerics>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, channelId]);

  useAppStateListener(undefined, handleAppBackground);

  /**
   * CHANNEL METHODS
   */
  const markRead: ChannelContextValue<StreamChatGenerics>['markRead'] = throttle(
    async (options?: MarkReadFunctionOptions) => {
      const { updateChannelUnreadState = true } = options ?? {};
      if (!channel || channel?.disconnected || !clientChannelConfig?.read_events) {
        return;
      }

      if (doMarkReadRequest) {
        doMarkReadRequest(channel, updateChannelUnreadState ? setChannelUnreadState : undefined);
      } else {
        try {
          const response = await channel.markRead();
          if (updateChannelUnreadState && response && lastRead) {
            setChannelUnreadState({
              last_read: lastRead,
              last_read_message_id: response?.event.last_read_message_id,
              unread_messages: 0,
            });
          }
        } catch (err) {
          console.log('Error marking channel as read:', err);
        }
      }
    },
    defaultThrottleInterval,
    throttleOptions,
  );

  const reloadThread = async () => {
    if (!channel || !thread?.id) {
      return;
    }
    setThreadLoadingMore(true);
    try {
      const parentID = thread.id;

      const limit = 50;
      channel.state.threads[parentID] = [];
      const queryResponse = await channel.getReplies(parentID, {
        limit,
      });

      const updatedHasMore = queryResponse.messages.length === limit;
      const updatedThreadMessages = channel.state.threads[parentID] || [];
      loadMoreThreadFinished(updatedHasMore, updatedThreadMessages);
      const { messages } = await channel.getMessagesById([parentID]);
      const [threadMessage] = messages;
      if (threadMessage && !threadInstance) {
        const formattedMessage = channel.state.formatMessage(threadMessage);
        setThread(formattedMessage);
      }
    } catch (err) {
      console.warn('Thread loading request failed with error', err);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
      setThreadLoadingMore(false);
      throw err;
    }
  };

  const resyncChannel = async () => {
    if (!channel || syncingChannelRef.current) {
      return;
    }
    syncingChannelRef.current = true;
    setError(false);

    if (channelMessagesState?.messages) {
      await channel?.watch({
        messages: {
          limit: channelMessagesState.messages.length + 30,
        },
      });
    }

    const parseMessage = (message: FormatMessageResponse<StreamChatGenerics>) =>
      ({
        ...message,
        created_at: message.created_at.toString(),
        pinned_at: message.pinned_at?.toString(),
        updated_at: message.updated_at?.toString(),
      }) as unknown as MessageResponse<StreamChatGenerics>;

    try {
      if (!thread) {
        copyChannelState();

        const failedMessages = channelMessagesState.messages
          ?.filter((message) => message.status === MessageStatusTypes.FAILED)
          .map(parseMessage);
        if (failedMessages?.length) {
          channel.state.addMessagesSorted(failedMessages);
        }
        channel.state.setIsUpToDate(true);
      } else {
        await reloadThread();

        const failedThreadMessages = thread
          ? threadMessages
              .filter((message) => message.status === MessageStatusTypes.FAILED)
              .map(parseMessage)
          : [];
        if (failedThreadMessages.length) {
          channel.state.addMessagesSorted(failedThreadMessages);
          setThreadMessages([...channel.state.threads[thread.id]]);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
    }

    syncingChannelRef.current = false;
  };

  // resync channel is added to ref so that it can be used in useEffect without adding it as a dependency
  const resyncChannelRef = useRef(resyncChannel);
  resyncChannelRef.current = resyncChannel;

  useEffect(() => {
    const connectionChangedHandler = () => {
      if (shouldSyncChannel) {
        resyncChannelRef.current();
      }
    };
    let connectionChangedSubscription: ReturnType<ChannelType['on']>;

    if (enableOfflineSupport) {
      connectionChangedSubscription = DBSyncManager.onSyncStatusChange((statusChanged) => {
        if (statusChanged) {
          connectionChangedHandler();
        }
      });
    } else {
      connectionChangedSubscription = client.on('connection.changed', (event) => {
        if (event.online) {
          connectionChangedHandler();
        }
      });
    }
    return () => {
      connectionChangedSubscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableOfflineSupport, shouldSyncChannel]);

  // In case the channel is disconnected which may happen when channel is deleted,
  // underlying js client throws an error. Following function ensures that Channel component
  // won't result in error in such a case.
  const getChannelConfigSafely = () => {
    try {
      return channel?.getConfig();
    } catch (_) {
      return null;
    }
  };

  /**
   * Channel configs for use in disabling local functionality.
   * Nullish coalescing is used to give first priority to props to override
   * the server settings. Then priority to server settings to override defaults.
   */
  const clientChannelConfig = getChannelConfigSafely();

  const reloadChannel = async () => {
    try {
      await loadLatestMessages();
    } catch (err) {
      console.warn('Reloading channel failed with error:', err);
    }
  };

  const loadChannelAroundMessage: ChannelContextValue<StreamChatGenerics>['loadChannelAroundMessage'] =
    async ({ messageId: messageIdToLoadAround }): Promise<void> => {
      if (!messageIdToLoadAround) {
        return;
      }
      try {
        if (thread) {
          setThreadLoadingMore(true);
          try {
            await channel.state.loadMessageIntoState(messageIdToLoadAround, thread.id);
            setThreadLoadingMore(false);
            setThreadMessages(channel.state.threads[thread.id]);
            if (setTargetedMessage) {
              setTargetedMessage(messageIdToLoadAround);
            }
          } catch (err) {
            if (err instanceof Error) {
              setError(err);
            } else {
              setError(true);
            }
            setThreadLoadingMore(false);
          }
        } else {
          await loadChannelAroundMessageFn({
            messageId: messageIdToLoadAround,
            setTargetedMessage,
          });
        }
      } catch (err) {
        console.warn('Loading channel around message failed with error:', err);
      }
    };

  /**
   * MESSAGE METHODS
   */
  const updateMessage: MessagesContextValue<StreamChatGenerics>['updateMessage'] = (
    updatedMessage,
    extraState = {},
  ) => {
    if (!channel) {
      return;
    }

    channel.state.addMessageSorted(updatedMessage, true);
    copyMessagesStateFromChannel(channel);

    if (thread && updatedMessage.parent_id) {
      extraState.threadMessages = channel.state.threads[updatedMessage.parent_id] || [];
      setThreadMessages(extraState.threadMessages);
    }
  };

  const replaceMessage = (
    oldMessage: MessageResponse<StreamChatGenerics>,
    newMessage: MessageResponse<StreamChatGenerics>,
  ) => {
    if (channel) {
      channel.state.removeMessage(oldMessage);
      channel.state.addMessageSorted(newMessage, true);
      copyMessagesStateFromChannel(channel);

      if (thread && newMessage.parent_id) {
        const threadMessages = channel.state.threads[newMessage.parent_id] || [];
        setThreadMessages(threadMessages);
      }
    }
  };

  const createMessagePreview = ({
    attachments,
    mentioned_users,
    parent_id,
    poll,
    poll_id,
    text,
    ...extraFields
  }: Partial<StreamMessage<StreamChatGenerics>>) => {
    // Exclude following properties from message.user within message preview,
    // since they could be long arrays and have no meaning as sender of message.
    // Storing such large value within user's table may cause sqlite queries to crash.
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { channel_mutes, devices, mutes, ...messageUser } = client.user;

    const preview = {
      __html: text,
      attachments,
      created_at: new Date(),
      html: text,
      id: `${client.userID}-${generateRandomId()}`,
      mentioned_users:
        mentioned_users?.map((userId) => ({
          id: userId,
        })) || [],
      parent_id,
      poll,
      poll_id,
      reactions: [],
      status: MessageStatusTypes.SENDING,
      text,
      type: 'regular',
      user: {
        ...messageUser,
        id: client.userID,
      },
      ...extraFields,
    } as unknown as MessageResponse<StreamChatGenerics>;

    /**
     * This is added to the message for local rendering prior to the message
     * being returned from the backend, it is removed when the message is sent
     * as quoted_message is a reserved field.
     */
    if (preview.quoted_message_id) {
      const quotedMessage = channelMessagesState.messages?.find(
        (message) => message.id === preview.quoted_message_id,
      );

      preview.quoted_message =
        quotedMessage as MessageResponse<StreamChatGenerics>['quoted_message'];
    }
    return preview;
  };

  const uploadPendingAttachments = async (message: MessageResponse<StreamChatGenerics>) => {
    const updatedMessage = { ...message };
    if (updatedMessage.attachments?.length) {
      for (let i = 0; i < updatedMessage.attachments?.length; i++) {
        const attachment = updatedMessage.attachments[i];
        const image = attachment.originalImage;
        const file = attachment.originalFile;
        // check if image_url is not a remote url
        if (
          attachment.type === FileTypes.Image &&
          image?.uri &&
          attachment.image_url &&
          isLocalUrl(attachment.image_url)
        ) {
          const filename = image.name ?? getFileNameFromPath(image.uri);
          // if any upload is in progress, cancel it
          const controller = uploadAbortControllerRef.current.get(filename);
          if (controller) {
            controller.abort();
            uploadAbortControllerRef.current.delete(filename);
          }
          const compressedUri = await compressedImageURI(image, compressImageQuality);
          const contentType = lookup(filename) || 'multipart/form-data';

          const uploadResponse = doImageUploadRequest
            ? await doImageUploadRequest(image, channel)
            : await channel.sendImage(compressedUri, filename, contentType);

          attachment.image_url = uploadResponse.file;
          delete attachment.originalFile;

          await dbApi.updateMessage({
            message: { ...updatedMessage, cid: channel.cid },
          });
        }

        if (
          (attachment.type === FileTypes.File ||
            attachment.type === FileTypes.Audio ||
            attachment.type === FileTypes.VoiceRecording ||
            attachment.type === FileTypes.Video) &&
          attachment.asset_url &&
          isLocalUrl(attachment.asset_url) &&
          file?.uri
        ) {
          // if any upload is in progress, cancel it
          const controller = uploadAbortControllerRef.current.get(file.name);
          if (controller) {
            controller.abort();
            uploadAbortControllerRef.current.delete(file.name);
          }
          const response = doDocUploadRequest
            ? await doDocUploadRequest(file, channel)
            : await channel.sendFile(file.uri, file.name, file.mimeType);
          attachment.asset_url = response.file;
          if (response.thumb_url) {
            attachment.thumb_url = response.thumb_url;
          }

          delete attachment.originalFile;
          await dbApi.updateMessage({
            message: { ...updatedMessage, cid: channel.cid },
          });
        }
      }
    }

    return updatedMessage;
  };

  const sendMessageRequest = async (
    message: MessageResponse<StreamChatGenerics>,
    retrying?: boolean,
  ) => {
    try {
      const updatedMessage = await uploadPendingAttachments(message);
      const extraFields = omit(updatedMessage, [
        '__html',
        'attachments',
        'created_at',
        'deleted_at',
        'html',
        'id',
        'latest_reactions',
        'mentioned_users',
        'own_reactions',
        'parent_id',
        'quoted_message',
        'reaction_counts',
        'reaction_groups',
        'reactions',
        'status',
        'text',
        'type',
        'updated_at',
        'user',
      ]);
      const { attachments, id, mentioned_users, parent_id, text } = updatedMessage;
      if (!channel.id) {
        return;
      }

      const mentionedUserIds = mentioned_users?.map((user) => user.id) || [];

      const messageData = {
        attachments,
        id,
        mentioned_users: mentionedUserIds,
        parent_id,
        text: patchMessageTextCommand(text ?? '', mentionedUserIds),
        ...extraFields,
      } as StreamMessage<StreamChatGenerics>;

      let messageResponse = {} as SendMessageAPIResponse<StreamChatGenerics>;
      if (doSendMessageRequest) {
        messageResponse = await doSendMessageRequest(channel?.cid || '', messageData);
      } else if (channel) {
        messageResponse = await channel.sendMessage(messageData);
      }

      if (messageResponse.message) {
        messageResponse.message.status = MessageStatusTypes.RECEIVED;

        if (enableOfflineSupport) {
          await dbApi.updateMessage({
            message: { ...messageResponse.message, cid: channel.cid },
          });
        }
        if (retrying) {
          replaceMessage(message, messageResponse.message);
        } else {
          updateMessage(messageResponse.message);
        }

        threadInstance?.upsertReplyLocally?.({ message: messageResponse.message });
      }
    } catch (err) {
      console.log(err);
      message.status = MessageStatusTypes.FAILED;
      const updatedMessage = { ...message, cid: channel.cid };
      updateMessage(updatedMessage);
      threadInstance?.upsertReplyLocally?.({ message: updatedMessage });

      if (enableOfflineSupport) {
        await dbApi.updateMessage({
          message: { ...message, cid: channel.cid },
        });
      }
    }
  };

  const sendMessage: InputMessageInputContextValue<StreamChatGenerics>['sendMessage'] = async (
    message,
  ) => {
    if (channel?.state?.filterErrorMessages) {
      channel.state.filterErrorMessages();
    }

    const messagePreview = createMessagePreview({
      ...message,
      attachments: message.attachments || [],
    });

    updateMessage(messagePreview, {
      commands: [],
      messageInput: '',
    });
    threadInstance?.upsertReplyLocally?.({ message: messagePreview });

    if (enableOfflineSupport) {
      // While sending a message, we add the message to local db with failed status, so that
      // if app gets closed before message gets sent and next time user opens the app
      // then user can see that message in failed state and can retry.
      // If succesfull, it will be updated with received status.
      await dbApi.upsertMessages({
        messages: [{ ...messagePreview, cid: channel.cid, status: MessageStatusTypes.FAILED }],
      });
    }

    await sendMessageRequest(messagePreview);
  };

  const retrySendMessage: MessagesContextValue<StreamChatGenerics>['retrySendMessage'] = async (
    message,
  ) => {
    const statusPendingMessage = {
      ...message,
      status: MessageStatusTypes.SENDING,
    };

    const messageWithoutReservedFields = removeReservedFields(statusPendingMessage);

    // For bounced messages, we don't need to update the message, instead always send a new message.
    if (!isBouncedMessage(message)) {
      updateMessage(messageWithoutReservedFields as MessageResponse<StreamChatGenerics>);
    }

    await sendMessageRequest(
      messageWithoutReservedFields as MessageResponse<StreamChatGenerics>,
      true,
    );
  };

  const editMessage: InputMessageInputContextValue<StreamChatGenerics>['editMessage'] = (
    updatedMessage,
  ) =>
    doUpdateMessageRequest
      ? doUpdateMessageRequest(channel?.cid || '', updatedMessage)
      : client.updateMessage(updatedMessage);

  const setEditingState: MessagesContextValue<StreamChatGenerics>['setEditingState'] = (
    message,
  ) => {
    clearQuotedMessageState();
    setEditing(message);
  };

  const setQuotedMessageState: MessagesContextValue<StreamChatGenerics>['setQuotedMessageState'] = (
    messageOrBoolean,
  ) => {
    setQuotedMessage(messageOrBoolean);
  };

  const clearEditingState: InputMessageInputContextValue<StreamChatGenerics>['clearEditingState'] =
    () => setEditing(undefined);

  const clearQuotedMessageState: InputMessageInputContextValue<StreamChatGenerics>['clearQuotedMessageState'] =
    () => setQuotedMessage(undefined);

  /**
   * Removes the message from local state
   */
  const removeMessage: MessagesContextValue<StreamChatGenerics>['removeMessage'] = async (
    message,
  ) => {
    if (channel) {
      channel.state.removeMessage(message);
      copyMessagesStateFromChannel(channel);

      if (thread) {
        setThreadMessages(channel.state.threads[thread.id] || []);
      }
    }

    if (enableOfflineSupport) {
      await dbApi.deleteMessage({
        id: message.id,
      });
    }
  };

  const sendReaction = async (type: string, messageId: string) => {
    if (!channel?.id || !client.user) {
      throw new Error('Channel has not been initialized');
    }

    const payload: Parameters<ChannelClass<StreamChatGenerics>['sendReaction']> = [
      messageId,
      {
        type,
      } as Reaction<StreamChatGenerics>,
      { enforce_unique: enforceUniqueReaction },
    ];

    if (!enableOfflineSupport) {
      await channel.sendReaction(...payload);
      return;
    }

    addReactionToLocalState<StreamChatGenerics>({
      channel,
      enforceUniqueReaction,
      messageId,
      reactionType: type,
      user: client.user,
    });

    copyMessagesStateFromChannel(channel);

    const sendReactionResponse = await DBSyncManager.queueTask<StreamChatGenerics>({
      client,
      task: {
        channelId: channel.id,
        channelType: channel.type,
        messageId,
        payload,
        type: 'send-reaction',
      },
    });
    if (sendReactionResponse?.message) {
      threadInstance?.upsertReplyLocally?.({ message: sendReactionResponse.message });
    }
  };

  const deleteMessage: MessagesContextValue<StreamChatGenerics>['deleteMessage'] = async (
    message,
  ) => {
    if (!channel.id) {
      throw new Error('Channel has not been initialized yet');
    }

    if (!enableOfflineSupport) {
      if (message.status === MessageStatusTypes.FAILED) {
        await removeMessage(message);
        return;
      }
      await client.deleteMessage(message.id);
      return;
    }

    if (message.status === MessageStatusTypes.FAILED) {
      await DBSyncManager.dropPendingTasks({ messageId: message.id });
      await removeMessage(message);
    } else {
      const updatedMessage = {
        ...message,
        cid: channel.cid,
        deleted_at: new Date().toISOString(),
        type: 'deleted',
      };
      updateMessage(updatedMessage);

      threadInstance?.upsertReplyLocally({ message: updatedMessage });

      const data = await DBSyncManager.queueTask<StreamChatGenerics>({
        client,
        task: {
          channelId: channel.id,
          channelType: channel.type,
          messageId: message.id,
          payload: [message.id],
          type: 'delete-message',
        },
      });

      if (data?.message) {
        updateMessage({ ...data.message });
      }
    }
  };

  const deleteReaction: MessagesContextValue<StreamChatGenerics>['deleteReaction'] = async (
    type: string,
    messageId: string,
  ) => {
    if (!channel?.id || !client.user) {
      throw new Error('Channel has not been initialized');
    }

    const payload: Parameters<ChannelClass['deleteReaction']> = [messageId, type];

    if (!enableOfflineSupport) {
      await channel.deleteReaction(...payload);
      return;
    }

    removeReactionFromLocalState({
      channel,
      messageId,
      reactionType: type,
      user: client.user,
    });

    copyMessagesStateFromChannel(channel);

    await DBSyncManager.queueTask<StreamChatGenerics>({
      client,
      task: {
        channelId: channel.id,
        channelType: channel.type,
        messageId,
        payload,
        type: 'delete-reaction',
      },
    });
  };

  /**
   * THREAD METHODS
   */
  const openThread: ThreadContextValue<StreamChatGenerics>['openThread'] = useCallback(
    (message) => {
      setThread(message);

      if (channel.initialized) {
        channel.markRead({ thread_id: message.id });
      }
      // This was causing inconsistencies within the thread state as well as being responsible
      // of threads essentially never unloading (due to all of the previous threads + 50 loading
      // every time we'd run this). It seemingly has no impact (other than a performance boost)
      // and having it was causing issues with the Threads V2 architecture.
      // setThreadMessages(newThreadMessages);
    },
    [channel, setThread],
  );

  const closeThread: ThreadContextValue<StreamChatGenerics>['closeThread'] = useCallback(() => {
    setThread(null);
    setThreadMessages([]);
  }, [setThread, setThreadMessages]);

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreThreadFinished = useRef(
    debounce(
      (
        newThreadHasMore: boolean,
        updatedThreadMessages: ChannelState<StreamChatGenerics>['threads'][string],
      ) => {
        setThreadHasMore(newThreadHasMore);
        setThreadLoadingMore(false);
        setThreadMessages(updatedThreadMessages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  const loadMoreThread: ThreadContextValue<StreamChatGenerics>['loadMoreThread'] = async () => {
    if (threadLoadingMore || !thread?.id) {
      return;
    }
    setThreadLoadingMore(true);

    try {
      if (channel) {
        const parentID = thread.id;

        /**
         * In the channel is re-initializing, then threads may get wiped out during the process
         * (check `addMessagesSorted` method on channel.state). In those cases, we still want to
         * preserve the messages on active thread, so lets simply copy messages from UI state to
         * `channel.state`.
         */
        channel.state.threads[parentID] = threadMessages;
        const oldestMessageID = threadMessages?.[0]?.id;

        const limit = 50;
        const queryResponse = await channel.getReplies(parentID, {
          id_lt: oldestMessageID,
          limit,
        });

        const updatedHasMore = queryResponse.messages.length === limit;
        const updatedThreadMessages = channel.state.threads[parentID] || [];
        loadMoreThreadFinished(updatedHasMore, updatedThreadMessages);
      }
    } catch (err) {
      console.warn('Message pagination request failed with error', err);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
      setThreadLoadingMore(false);
      throw err;
    }
  };

  const ownCapabilitiesContext = useCreateOwnCapabilitiesContext({
    channel,
    overrideCapabilities: overrideOwnCapabilities,
  });

  const channelContext = useCreateChannelContext<StreamChatGenerics>({
    channel,
    channelUnreadState,
    disabled: !!channel?.data?.frozen,
    EmptyStateIndicator,
    enableMessageGroupingByUser,
    enforceUniqueReaction,
    error,
    giphyEnabled:
      giphyEnabled ??
      !!(clientChannelConfig?.commands || [])?.some((command) => command.name === 'giphy'),
    hideDateSeparators,
    hideStickyDateHeader,
    highlightedMessageId,
    isChannelActive: shouldSyncChannel,
    lastRead,
    loadChannelAroundMessage,
    loadChannelAtFirstUnreadMessage,
    loading: channelMessagesState.loading,
    LoadingIndicator,
    markRead,
    maxTimeBetweenGroupedMessages,
    members: channelState.members ?? {},
    NetworkDownIndicator,
    read: channelState.read ?? {},
    reloadChannel,
    scrollToFirstUnreadThreshold,
    setChannelUnreadState,
    setLastRead,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    threadList,
    uploadAbortControllerRef,
    watcherCount: channelState.watcherCount,
    watchers: channelState.watchers,
  });

  // This is mainly a hack to get around an issue with sendMessage not being passed correctly as a
  // useMemo() dependency. The easy fix is to add it to the dependency array, however that would mean
  // that this (very used) context is essentially going to cause rerenders on pretty much every Channel
  // render, since sendMessage is an inline function. Wrapping it in useCallback() is one way to fix it
  // but it is definitely not trivial, especially considering it depends on other inline functions that
  // are not wrapped in a useCallback() themselves hence creating a huge cascading change. Can be removed
  // once our memoization issues are fixed in most places in the app or we move to a reactive state store.
  const sendMessageRef =
    useRef<InputMessageInputContextValue<StreamChatGenerics>['sendMessage']>(sendMessage);
  sendMessageRef.current = sendMessage;

  const inputMessageInputContext = useCreateInputMessageInputContext<StreamChatGenerics>({
    additionalTextInputProps,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    asyncMessagesMultiSendEnabled,
    asyncMessagesSlideToCancelDistance,
    AttachButton,
    AudioAttachmentUploadPreview,
    AudioRecorder,
    audioRecordingEnabled,
    AudioRecordingInProgress,
    AudioRecordingLockIndicator,
    AudioRecordingPreview,
    AudioRecordingWaveform,
    autoCompleteSuggestionsLimit,
    autoCompleteTriggerSettings,
    channelId,
    clearEditingState,
    clearQuotedMessageState,
    CommandsButton,
    compressImageQuality,
    CooldownTimer,
    CreatePollContent,
    doDocUploadRequest,
    doImageUploadRequest,
    editing,
    editMessage,
    emojiSearchIndex,
    FileUploadPreview,
    handleAttachButtonPress,
    hasCameraPicker,
    hasCommands,
    hasFilePicker,
    hasImagePicker,
    ImageUploadPreview,
    initialValue,
    Input,
    InputButtons,
    InputEditingStateHeader,
    InputGiphySearch,
    InputReplyStateHeader,
    maxMessageLength: maxMessageLengthProp ?? clientChannelConfig?.max_message_length ?? undefined,
    maxNumberOfFiles,
    mentionAllAppUsersEnabled,
    mentionAllAppUsersQuery,
    MoreOptionsButton,
    numberOfLines,
    onChangeText,
    openPollCreationDialog,
    quotedMessage,
    SendButton,
    sendImageAsync,
    sendMessage: (...args) => sendMessageRef.current(...args),
    SendMessageDisallowedIndicator,
    setInputRef,
    setQuotedMessageState,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    StopMessageStreamingButton,
    UploadProgressIndicator,
  });

  const messageListContext = useCreatePaginatedMessageListContext({
    channelId,
    hasMore: channelMessagesState.hasMore,
    loadingMore: loadingMoreProp !== undefined ? loadingMoreProp : channelMessagesState.loadingMore,
    loadingMoreRecent:
      loadingMoreRecentProp !== undefined
        ? loadingMoreRecentProp
        : channelMessagesState.loadingMoreRecent,
    loadLatestMessages,
    loadMore,
    loadMoreRecent,
    messages: channelMessagesState.messages ?? [],
  });

  const messagesContext = useCreateMessagesContext({
    additionalPressableProps,
    Attachment,
    AttachmentActions,
    AudioAttachment,
    Card,
    CardCover,
    CardFooter,
    CardHeader,
    channelId,
    clearQuotedMessageState,
    DateHeader,
    deletedMessagesVisibilityType,
    deleteMessage,
    deleteReaction,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    FileAttachment,
    FileAttachmentGroup,
    FileAttachmentIcon,
    FlatList,
    forceAlignMessages,
    Gallery,
    getMessagesGroupStyles,
    Giphy,
    giphyVersion,
    handleBan,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    hasCreatePoll:
      hasCreatePoll === undefined ? pollCreationEnabled : hasCreatePoll && pollCreationEnabled,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    initialScrollToFirstUnreadMessage: !messageId && initialScrollToFirstUnreadMessage, // when messageId is set, we scroll to the messageId instead of first unread
    InlineDateSeparator,
    InlineUnreadIndicator,
    isAttachmentEqual,
    isMessageAIGenerated,
    legacyImageViewerSwipeBehaviour,
    markdownRules,
    Message,
    MessageActionList,
    MessageActionListItem,
    messageActions,
    MessageAvatar,
    MessageBounce,
    MessageContent,
    messageContentOrder,
    MessageDeleted,
    MessageEditedTimestamp,
    MessageError,
    MessageFooter,
    MessageHeader,
    MessageList,
    MessageMenu,
    MessagePinnedHeader,
    MessageReactionPicker,
    MessageReplies,
    MessageRepliesAvatars,
    MessageSimple,
    MessageStatus,
    MessageSwipeContent,
    messageSwipeToReplyHitSlop,
    MessageSystem,
    MessageText,
    messageTextNumberOfLines,
    MessageTimestamp,
    MessageUserReactions,
    MessageUserReactionsAvatar,
    MessageUserReactionsItem,
    myMessageTheme,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    PollContent,
    ReactionListBottom,
    reactionListPosition,
    ReactionListTop,
    removeMessage,
    Reply,
    retrySendMessage,
    ScrollToBottomButton,
    selectReaction,
    sendReaction,
    setEditingState,
    setQuotedMessageState,
    shouldShowUnreadUnderlay,
    StreamingMessageView,
    supportedReactions,
    targetedMessage,
    TypingIndicator,
    TypingIndicatorContainer,
    UnreadMessagesNotification,
    updateMessage,
    UrlPreview,
    VideoThumbnail,
  });

  const suggestionsContext = {
    AutoCompleteSuggestionHeader,
    AutoCompleteSuggestionItem,
    AutoCompleteSuggestionList,
  };

  const threadContext = useCreateThreadContext({
    allowThreadMessagesInChannel,
    closeThread,
    loadMoreThread,
    openThread,
    reloadThread,
    setThreadLoadingMore,
    thread,
    threadHasMore,
    threadInstance,
    threadLoadingMore,
    threadMessages,
  });

  const typingContext = useCreateTypingContext({
    typing: channelState.typing ?? {},
  });

  // TODO: replace the null view with appropriate message. Currently this is waiting a design decision.
  if (deleted) {
    return null;
  }

  if (!channel || (error && channelMessagesState.messages?.length === 0)) {
    return <LoadingErrorIndicator error={error} listType='message' retry={reloadChannel} />;
  }

  if (!channel?.cid || !channel.watch) {
    return (
      <Text style={[styles.selectChannel, { color: black }, selectChannel]} testID='no-channel'>
        {t<string>('Please select a channel first')}
      </Text>
    );
  }

  return (
    <KeyboardCompatibleView
      behavior={keyboardBehavior}
      enabled={!disableKeyboardCompatibleView}
      keyboardVerticalOffset={keyboardVerticalOffset}
      {...additionalKeyboardAvoidingViewProps}
    >
      <ChannelProvider<StreamChatGenerics> value={channelContext}>
        <OwnCapabilitiesProvider value={ownCapabilitiesContext}>
          <TypingProvider<StreamChatGenerics> value={typingContext}>
            <PaginatedMessageListProvider<StreamChatGenerics> value={messageListContext}>
              <MessagesProvider<StreamChatGenerics> value={messagesContext}>
                <ThreadProvider<StreamChatGenerics> value={threadContext}>
                  <SuggestionsProvider<StreamChatGenerics> value={suggestionsContext}>
                    <MessageInputProvider<StreamChatGenerics> value={inputMessageInputContext}>
                      <View style={{ height: '100%' }}>{children}</View>
                    </MessageInputProvider>
                  </SuggestionsProvider>
                </ThreadProvider>
              </MessagesProvider>
            </PaginatedMessageListProvider>
          </TypingProvider>
        </OwnCapabilitiesProvider>
      </ChannelProvider>
    </KeyboardCompatibleView>
  );
};

export type ChannelProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<Omit<ChannelPropsWithContext<StreamChatGenerics>, 'channel' | 'thread'>> &
  Pick<ChannelPropsWithContext<StreamChatGenerics>, 'channel'> & {
    thread?: MessageType<StreamChatGenerics> | ThreadType<StreamChatGenerics> | null;
  };

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList, Thread, and MessageInput must be
 * children of the Channel component to receive the ChannelContext.
 *
 * @example ./Channel.md
 */
export const Channel = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<ChannelProps<StreamChatGenerics>>,
) => {
  const { client, enableOfflineSupport, isMessageAIGenerated } =
    useChatContext<StreamChatGenerics>();
  const { t } = useTranslationContext();

  const threadFromProps = props?.thread;
  const threadMessage = (
    threadFromProps?.threadInstance ? threadFromProps.thread : threadFromProps
  ) as MessageType<StreamChatGenerics>;
  const threadInstance = threadFromProps?.threadInstance as Thread;

  const thread: ThreadType<StreamChatGenerics> = {
    thread: threadMessage,
    threadInstance,
  };

  const shouldSyncChannel = threadMessage?.id ? !!props.threadList : true;

  const { setThreadMessages, threadMessages } = useChannelState<StreamChatGenerics>(
    props.channel,
    props.threadList ? threadMessage?.id : undefined,
  );

  return (
    <ChannelWithContext<StreamChatGenerics>
      {...{
        client,
        enableOfflineSupport,
        t,
      }}
      {...props}
      shouldSyncChannel={shouldSyncChannel}
      {...{
        isMessageAIGenerated,
        setThreadMessages,
        thread,
        threadMessages,
      }}
    />
  );
};
