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
  logChatPromiseExecution,
  MessageResponse,
  Reaction,
  SendMessageAPIResponse,
  StreamChat,
  Event as StreamEvent,
  Message as StreamMessage,
  Thread,
} from 'stream-chat';

import { useCreateChannelContext } from './hooks/useCreateChannelContext';

import { useCreateInputMessageInputContext } from './hooks/useCreateInputMessageInputContext';

import { useCreateMessagesContext } from './hooks/useCreateMessagesContext';

import { useCreateOwnCapabilitiesContext } from './hooks/useCreateOwnCapabilitiesContext';
import { useCreatePaginatedMessageListContext } from './hooks/useCreatePaginatedMessageListContext';

import { useCreateThreadContext } from './hooks/useCreateThreadContext';

import { useCreateTypingContext } from './hooks/useCreateTypingContext';

import { useTargetedMessage } from './hooks/useTargetedMessage';

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
import { FlatList as FlatListDefault, isImagePickerAvailable, pickDocument } from '../../native';
import * as dbApi from '../../store/apis';
import { DefaultStreamChatGenerics, FileTypes } from '../../types/types';
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
import { MessageTimestamp as MessageTimestampDefault } from '../Message/MessageSimple/MessageTimestamp';
import { ReactionList as ReactionListDefault } from '../Message/MessageSimple/ReactionList';
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
import { OverlayReactionList as OverlayReactionListDefault } from '../MessageOverlay/OverlayReactionList';
import { Reply as ReplyDefault } from '../Reply/Reply';

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
const scrollToFirstUnreadThreshold = 4;

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
  UseChannelStateValue<StreamChatGenerics> &
  Partial<
    Pick<
      MessagesContextValue<StreamChatGenerics>,
      | 'additionalTouchableProps'
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
      | 'handleBlock'
      | 'handleCopy'
      | 'handleDelete'
      | 'handleEdit'
      | 'handleFlag'
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
      | 'MessagePinnedHeader'
      | 'MessageReplies'
      | 'MessageRepliesAvatars'
      | 'MessageSimple'
      | 'MessageStatus'
      | 'MessageSystem'
      | 'MessageText'
      | 'MessageTimestamp'
      | 'myMessageTheme'
      | 'onLongPressMessage'
      | 'onPressInMessage'
      | 'onPressMessage'
      | 'OverlayReactionList'
      | 'ReactionList'
      | 'Reply'
      | 'ScrollToBottomButton'
      | 'selectReaction'
      | 'supportedReactions'
      | 'TypingIndicator'
      | 'TypingIndicatorContainer'
      | 'UrlPreview'
      | 'VideoThumbnail'
    >
  > &
  Partial<Pick<ThreadContextValue<StreamChatGenerics>, 'allowThreadMessagesInChannel'>> & {
    shouldSyncChannel: boolean;
    thread: ThreadType<StreamChatGenerics>;
    /**
     * Additional props passed to keyboard avoiding view
     */
    additionalKeyboardAvoidingViewProps?: Partial<KeyboardAvoidingViewProps>;
    /**
     * Disables the channel UI if the channel is frozen
     */
    disableIfFrozenChannel?: boolean;
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
    doMarkReadRequest?: (channel: ChannelType<StreamChatGenerics>) => void;
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
    maxMessageLength?: number;
    /**
     * Load the channel at a specified message instead of the most recent message.
     */
    messageId?: string;
    newMessageStateUpdateThrottleInterval?: number;
    overrideOwnCapabilities?: Partial<OwnCapabilitiesContextValue>;
    stateUpdateThrottleInterval?: number;
    /**
     * Tells if channel is rendering a thread list
     */
    threadList?: boolean;
  };

const ChannelWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: PropsWithChildren<ChannelPropsWithContext<StreamChatGenerics>>,
) => {
  const {
    additionalKeyboardAvoidingViewProps,
    additionalTextInputProps,
    additionalTouchableProps,
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
    DateHeader = DateHeaderDefault,
    deletedMessagesVisibilityType = 'always',
    disableIfFrozenChannel = true,
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
    enforceUniqueReaction = false,
    FileAttachment = FileAttachmentDefault,
    FileAttachmentGroup = FileAttachmentGroupDefault,
    FileAttachmentIcon = FileIconDefault,
    FileUploadPreview = FileUploadPreviewDefault,
    FlatList = FlatListDefault,
    forceAlignMessages,
    Gallery = GalleryDefault,
    getMessagesGroupStyles,
    Giphy = GiphyDefault,
    giphyEnabled,
    giphyVersion = 'fixed_height',
    handleAttachButtonPress,
    handleBan,
    handleBlock,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    hasCameraPicker = isImagePickerAvailable(),
    hasCommands = true,
    // If pickDocument isn't available, default to hiding the file picker
    hasFilePicker = pickDocument !== null,
    hasImagePicker = true,
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
    keyboardBehavior,
    KeyboardCompatibleView = KeyboardCompatibleViewDefault,
    keyboardVerticalOffset,
    legacyImageViewerSwipeBehaviour = false,
    LoadingErrorIndicator = LoadingErrorIndicatorDefault,
    LoadingIndicator = LoadingIndicatorDefault,
    loadingMore: loadingMoreProp,
    loadingMoreRecent: loadingMoreRecentProp,
    markdownRules,
    maxMessageLength: maxMessageLengthProp,
    maxNumberOfFiles = 10,
    maxTimeBetweenGroupedMessages,
    members,
    mentionAllAppUsersEnabled = false,
    mentionAllAppUsersQuery,
    Message = MessageDefault,
    messageActions,
    MessageAvatar = MessageAvatarDefault,
    MessageBounce = MessageBounceDefault,
    MessageContent = MessageContentDefault,
    messageContentOrder = ['quoted_reply', 'gallery', 'files', 'text', 'attachments'],
    MessageDeleted = MessageDeletedDefault,
    MessageEditedTimestamp = MessageEditedTimestampDefault,
    MessageError = MessageErrorDefault,
    MessageFooter = MessageFooterDefault,
    MessageHeader,
    messageId,
    MessageList = MessageListDefault,
    MessagePinnedHeader = MessagePinnedHeaderDefault,
    MessageReplies = MessageRepliesDefault,
    MessageRepliesAvatars = MessageRepliesAvatarsDefault,
    messages,
    MessageSimple = MessageSimpleDefault,
    MessageStatus = MessageStatusDefault,
    MessageSystem = MessageSystemDefault,
    MessageText,
    MessageTimestamp = MessageTimestampDefault,
    MoreOptionsButton = MoreOptionsButtonDefault,
    myMessageTheme,
    NetworkDownIndicator = NetworkDownIndicatorDefault,
    newMessageStateUpdateThrottleInterval = defaultThrottleInterval,
    numberOfLines = 5,
    onChangeText,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    OverlayReactionList = OverlayReactionListDefault,
    overrideOwnCapabilities,
    ReactionList = ReactionListDefault,
    read,
    Reply = ReplyDefault,
    ScrollToBottomButton = ScrollToBottomButtonDefault,
    selectReaction,
    SendButton = SendButtonDefault,
    sendImageAsync = false,
    SendMessageDisallowedIndicator = SendMessageDisallowedIndicatorDefault,
    setInputRef,
    setMembers,
    setMessages,
    setRead,
    setThreadMessages,
    setTyping,
    setWatcherCount,
    setWatchers,
    shouldSyncChannel,
    ShowThreadMessageInChannelButton = ShowThreadMessageInChannelButtonDefault,
    StartAudioRecordingButton = AudioRecordingButtonDefault,
    stateUpdateThrottleInterval = defaultThrottleInterval,
    StickyHeader = StickyHeaderDefault,
    supportedReactions = reactionData,
    t,
    thread: threadFromProps,
    threadList,
    threadMessages,
    typing,
    TypingIndicator = TypingIndicatorDefault,
    TypingIndicatorContainer = TypingIndicatorContainerDefault,
    UploadProgressIndicator = UploadProgressIndicatorDefault,
    UrlPreview = CardDefault,
    VideoThumbnail = VideoThumbnailDefault,
    watcherCount,
    watchers,
  } = props;

  const { thread: threadProps, threadInstance } = threadFromProps;

  const {
    theme: {
      channel: { selectChannel },
      colors: { black },
    },
  } = useTheme();
  const [deleted, setDeleted] = useState(false);
  const [editing, setEditing] = useState<MessageType<StreamChatGenerics> | undefined>(undefined);
  const [error, setError] = useState<Error | boolean>(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastRead, setLastRead] = useState<ChannelContextValue<StreamChatGenerics>['lastRead']>();
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
  const [quotedMessage, setQuotedMessage] = useState<boolean | MessageType<StreamChatGenerics>>(
    false,
  );
  const [thread, setThread] = useState<MessageType<StreamChatGenerics> | null>(threadProps || null);
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);

  const syncingChannelRef = useRef(false);

  /**
   * Flag to track if we know for sure that there are no more recent messages to load.
   * This is necessary to avoid unnecessary api calls to load recent messages on pagination.
   */
  const [hasNoMoreRecentMessagesToLoad, setHasNoMoreRecentMessagesToLoad] = useState(true);

  const { prevTargetedMessage, setTargetedMessage, targetedMessage } = useTargetedMessage();

  /**
   * If we loaded a channel around message
   * We may have moved latest message to a new message set in that case mark this ref to avoid fetching
   */
  const hasOverlappingRecentMessagesRef = useRef(false);

  /**
   * This ref will hold the abort controllers for
   * requests made for uploading images/files in the messageInputContext
   * Its a map of filename to AbortController
   */
  const uploadAbortControllerRef = useRef<Map<string, AbortController>>(new Map());

  const channelId = channel?.id || '';

  useEffect(() => {
    const initChannel = async () => {
      if (!channel || !shouldSyncChannel || channel.offlineMode) return;
      /**
       * Loading channel at first unread message  requires channel to be initialized in the first place,
       * since we use read state on channel to decide what offset to load channel at.
       * Also there is no use case from UX perspective, why one would need loading uninitialized channel at particular message.
       * If the channel is not initiated, then we need to do channel.watch, which is more expensive for backend than channel.query.
       */
      if (!channel.initialized) {
        await loadChannel();
      }

      if (messageId) {
        loadChannelAroundMessage({ messageId });
      }
      // The condition, where if the count of unread messages is greater than 4, then scroll to the first unread message.
      else if (
        initialScrollToFirstUnreadMessage &&
        channel.countUnread() > scrollToFirstUnreadThreshold
      ) {
        loadChannelAtFirstUnreadMessage();
      }
      // If the messageId is undefined and the last message and the current message id do not match we load the channel at the very bottom.
      else if (
        channel.state.messages?.[channel.state.messages.length - 1]?.id !==
          channel.state.latestMessages?.[channel.state.latestMessages.length - 1]?.id &&
        !messageId
      ) {
        await loadChannel();
      }
    };

    initChannel();

    return () => {
      copyChannelState.cancel();
      copyReadState.cancel();
      copyTypingState.cancel();
      loadMoreFinished.cancel();
      loadMoreThreadFinished.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, messageId]);

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
   * CHANNEL CONSTANTS
   */
  const isAdmin = client?.user?.role === 'admin' || channel?.state.membership.role === 'admin';

  const isModerator =
    channel?.state.membership.role === 'channel_moderator' ||
    channel?.state.membership.role === 'moderator';

  const isOwner = channel?.state.membership.role === 'owner';

  /**
   * CHANNEL METHODS
   */
  const markRead: ChannelContextValue<StreamChatGenerics>['markRead'] = useRef(
    throttle(
      () => {
        if (!channel || channel?.disconnected || !clientChannelConfig?.read_events) {
          return;
        }

        if (doMarkReadRequest) {
          doMarkReadRequest(channel);
        } else {
          logChatPromiseExecution(channel.markRead(), 'mark read');
        }
      },
      defaultThrottleInterval,
      throttleOptions,
    ),
  ).current;

  const copyMessagesState = useRef(
    throttle(
      () => {
        if (channel) {
          clearInterval(mergeSetsIntervalRef.current);
          setMessages(channel.state.messages);
          restartSetsMergeFuncRef.current();
        }
      },
      newMessageStateUpdateThrottleInterval,
      throttleOptions,
    ),
  ).current;

  const copyTypingState = useRef(
    throttle(
      () => {
        if (channel) {
          setTyping({ ...channel.state.typing });
        }
      },
      stateUpdateThrottleInterval,
      throttleOptions,
    ),
  ).current;

  const copyReadState = useRef(
    throttle(
      () => {
        if (channel) {
          setRead({ ...channel.state.read });
        }
      },
      stateUpdateThrottleInterval,
      throttleOptions,
    ),
  ).current;

  const copyChannelState = useRef(
    throttle(
      () => {
        setLoading(false);
        if (channel) {
          setMembers({ ...channel.state.members });
          setMessages([...channel.state.messages]);
          setRead({ ...channel.state.read });
          setTyping({ ...channel.state.typing });
          setWatcherCount(channel.state.watcher_count);
          setWatchers({ ...channel.state.watchers });
        }
      },
      stateUpdateThrottleInterval,
      throttleOptions,
    ),
  ).current;

  // subscribe to specific channel events
  useEffect(() => {
    const channelSubscriptions: Array<ReturnType<ChannelType['on']>> = [];
    if (channel && shouldSyncChannel) {
      channelSubscriptions.push(channel.on('message.new', copyMessagesState));
      channelSubscriptions.push(channel.on('message.read', copyReadState));
      channelSubscriptions.push(channel.on('typing.start', copyTypingState));
      channelSubscriptions.push(channel.on('typing.stop', copyTypingState));
    }
    return () => {
      channelSubscriptions.forEach((s) => s.unsubscribe());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, shouldSyncChannel]);

  // subscribe to the generic all channel event
  useEffect(() => {
    const handleEvent: EventHandler<StreamChatGenerics> = (event) => {
      const ignorableEvents = ['user.watching.start', 'user.watching.stop'];
      if (ignorableEvents.includes(event.type)) return;
      if (shouldSyncChannel) {
        const isTypingEvent = event.type === 'typing.start' || event.type === 'typing.stop';
        if (!isTypingEvent) {
          if (thread?.id) {
            const updatedThreadMessages =
              (thread.id && channel && channel.state.threads[thread.id]) || threadMessages;
            setThreadMessages(updatedThreadMessages);
          }

          if (channel && thread?.id && event.message?.id === thread.id && !threadInstance) {
            const updatedThread = channel.state.formatMessage(event.message);
            setThread(updatedThread);
          }
        }

        // only update channel state if the events are not the previously subscribed useEffect's subscription events
        if (
          channel &&
          channel.initialized &&
          event.type !== 'message.new' &&
          event.type !== 'message.read' &&
          event.type !== 'typing.start' &&
          event.type !== 'typing.stop'
        ) {
          copyChannelState();
        }
      }
    };
    const { unsubscribe } = channel.on(handleEvent);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, thread?.id, shouldSyncChannel]);

  // subscribe to channel.deleted event
  useEffect(() => {
    const { unsubscribe } = client.on('channel.deleted', (event) => {
      if (event.cid === channel?.cid) {
        setDeleted(true);
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    const handleEvent: EventHandler<StreamChatGenerics> = (event) => {
      if (channel.cid === event.cid) copyChannelState();
    };

    const { unsubscribe } = client.on('notification.mark_read', handleEvent);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const channelQueryCallRef = useRef(
    async (
      queryCall: () => Promise<void>,
      onAfterQueryCall: (() => void) | undefined = undefined,
      // if we are scrolling to a message after the query, pass it here
      scrollToMessageId: string | (() => string | undefined) | undefined = undefined,
    ) => {
      setError(false);
      try {
        clearInterval(mergeSetsIntervalRef.current);
        await queryCall();
        setLastRead(new Date());
        setHasMore(true);
        const currentMessages = channel.state.messages;
        const hadCurrentLatestMessages =
          currentMessages.length > 0 && currentMessages === channel.state.latestMessages;
        if (typeof scrollToMessageId === 'function') {
          scrollToMessageId = scrollToMessageId();
        }

        const scrollToMessageIndex = scrollToMessageId
          ? currentMessages.findIndex(({ id }) => id === scrollToMessageId)
          : -1;
        if (channel && scrollToMessageIndex !== -1) {
          copyChannelState.cancel();
          // We assume that on average user sees 5 messages on screen
          // We dont want new renders to happen while scrolling to the targeted message
          // hence we limit the number of messages to be rendered after the targeted message to 5 - 1 = 4
          // NOTE: we have one drawback here, if there were already a split latest and current message set
          // the previous latest message set will be thrown away as we cannot merge it with the current message set after the target message is set
          const limitAfter = 4;
          const currentLength = currentMessages.length;
          const noOfMessagesAfter = currentLength - scrollToMessageIndex - 1;
          // number of messages are over the limit, limit the length of messages
          if (noOfMessagesAfter > limitAfter) {
            const endIndex = scrollToMessageIndex + limitAfter;
            channel.state.clearMessages();
            channel.state.messages = currentMessages.slice(0, endIndex + 1);
            splitLatestCurrentMessageSetRef.current();
            const restOfMessages = currentMessages.slice(endIndex + 1);
            if (hadCurrentLatestMessages) {
              const latestSet = channel.state.messageSets.find((set) => set.isLatest);
              if (latestSet) {
                latestSet.messages = restOfMessages;
                hasOverlappingRecentMessagesRef.current = true;
              }
            }
          }
        }
        const hasLatestMessages = channel.state.latestMessages.length > 0;
        channel.state.setIsUpToDate(hasLatestMessages);
        setHasNoMoreRecentMessagesToLoad(hasLatestMessages);
        copyChannelState();
        if (scrollToMessageIndex !== -1) {
          // since we need to scroll after immediately do this without throttle
          copyChannelState.flush();
        }
        onAfterQueryCall?.();
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(true);
        }
        setLoading(false);
        setLastRead(new Date());
      }
    },
  );

  /**
   * Loads channel at first unread message.
   */
  const loadChannelAtFirstUnreadMessage = () => {
    if (!channel) return;
    let unreadMessageIdToScrollTo: string | undefined;
    // query for messages around the last read date
    return channelQueryCallRef.current(
      async () => {
        const unreadCount = channel.countUnread();
        if (unreadCount === 0) return;
        const isLatestMessageSetShown = !!channel.state.messageSets.find(
          (set) => set.isCurrent && set.isLatest,
        );
        if (isLatestMessageSetShown && unreadCount <= channel.state.messages.length) {
          unreadMessageIdToScrollTo =
            channel.state.messages[channel.state.messages.length - unreadCount].id;
          return;
        }
        const lastReadDate = channel.lastRead();

        // if last read date is present we can just fetch messages around that date
        // last read date not being present is an edge case if somewhere the user of SDK deletes the read state (this will usually never happen)
        if (lastReadDate) {
          setLoading(true);
          // get totally 30 messages... max 15 before last read date and max 15 after last read date
          // ref: https://github.com/GetStream/chat/pull/2588
          const res = await channel.query(
            {
              messages: {
                created_at_around: lastReadDate,
                limit: 30,
              },
              watch: true,
            },
            'new',
          );
          unreadMessageIdToScrollTo = res.messages.find(
            (m) => lastReadDate < (m.created_at ? new Date(m.created_at) : new Date()),
          )?.id;
          if (unreadMessageIdToScrollTo) {
            channel.state.loadMessageIntoState(unreadMessageIdToScrollTo);
          }
        } else {
          await loadLatestMessagesRef.current();
        }
      },
      () => {
        if (unreadMessageIdToScrollTo) {
          restartSetsMergeFuncRef.current();
        }
      },
      () => unreadMessageIdToScrollTo,
    );
  };

  /**
   * Loads channel around a specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   */
  const loadChannelAroundMessage: ChannelContextValue<StreamChatGenerics>['loadChannelAroundMessage'] =
    async ({ messageId: messageIdToLoadAround }) => {
      if (thread) {
        if (messageIdToLoadAround) {
          setThreadLoadingMore(true);
          try {
            await channel.state.loadMessageIntoState(messageIdToLoadAround, thread.id);
            setThreadLoadingMore(false);
            setThreadMessages(channel.state.threads[thread.id]);
            setTargetedMessage(messageIdToLoadAround);
          } catch (err) {
            if (err instanceof Error) {
              setError(err);
            } else {
              setError(true);
            }
            setThreadLoadingMore(false);
          }
        }
      } else {
        await channelQueryCallRef.current(
          async () => {
            setLoading(true);
            if (messageIdToLoadAround) {
              setMessages([]);
              await channel.state.loadMessageIntoState(messageIdToLoadAround);
              const currentMessageSet = channel.state.messageSets.find((set) => set.isCurrent);
              if (currentMessageSet && !currentMessageSet?.isLatest) {
                // if the current message set is not the latest, we will throw away the latest messages
                // in order to attempt to not throw away, will attempt to merge it by loading 25 more messages
                const recentCurrentSetMsgId =
                  currentMessageSet.messages[currentMessageSet.messages.length - 1].id;
                await channel.query(
                  {
                    messages: {
                      id_gte: recentCurrentSetMsgId,
                      limit: 25,
                    },
                  },
                  'current',
                );
                // if the gap is more than 25, we will unfortunately have to throw away the latest messages
              }
            }
          },
          () => {
            if (messageIdToLoadAround) {
              clearInterval(mergeSetsIntervalRef.current); // do not merge sets as we will scroll/highlight to the message
              setTargetedMessage(messageIdToLoadAround);
            }
          },
          messageIdToLoadAround,
        );
      }
    };

  useEffect(() => {
    if (!targetedMessage && prevTargetedMessage) {
      // we cleared the merge sets interval to wait for the targeted message to be set
      // now restart it since its done
      restartSetsMergeFuncRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetedMessage]);

  /**
   * @deprecated use loadChannelAroundMessage instead
   *
   * Loads channel at specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   * @param before Number of message to query before messageId
   * @param after Number of message to query after messageId
   */
  const loadChannelAtMessage: ChannelContextValue<StreamChatGenerics>['loadChannelAtMessage'] = ({
    after = 2,
    before = 30,
    messageId,
  }) =>
    channelQueryCallRef.current(async () => {
      await queryAtMessage({ after, before, messageId });

      if (messageId) {
        setTargetedMessage(messageId);
      }
    });

  /**
   * Utility method to mark that current set if latest into two.
   * With an empty latest set
   * This is useful when we know that we dont know the latest messages anymore
   * Or if we are loading a channel around a message
   */
  const splitLatestCurrentMessageSetRef = useRef(() => {
    const currentLatestSet = channel.state.messageSets.find((set) => set.isCurrent && set.isLatest);
    if (!currentLatestSet) return;
    // unmark the current latest set
    currentLatestSet.isLatest = false;
    // create a new set with empty latest messages
    channel.state.messageSets.push({
      isCurrent: false,
      isLatest: true,
      messages: [],
      pagination: {
        hasNext: true,
        hasPrev: true,
      },
    });
  });

  /**
   * Utility method to merge current and latest message set.
   * Returns true if merge was successful, false otherwise.
   */
  const mergeOverlappingMessageSetsRef = useRef((limitToMaxRenderPerBatch = false) => {
    if (hasOverlappingRecentMessagesRef.current) {
      const limit = 5; // 5 is the load to recent limit, a larger value seems to cause jumpiness in some devices..
      // merge current and latest sets
      const latestMessageSet = channel.state.messageSets.find((set) => set.isLatest);
      const currentMessageSet = channel.state.messageSets.find((set) => set.isCurrent);
      if (latestMessageSet && currentMessageSet && latestMessageSet !== currentMessageSet) {
        if (limitToMaxRenderPerBatch && latestMessageSet.messages.length > limit) {
          currentMessageSet.messages = currentMessageSet.messages.concat(
            latestMessageSet.messages.slice(0, limit),
          );
          latestMessageSet.messages = latestMessageSet.messages.slice(limit);
        } else {
          channel.state.messageSets = channel.state.messageSets.filter((set) => !set.isLatest);
          currentMessageSet.messages = currentMessageSet.messages.concat(latestMessageSet.messages);
          currentMessageSet.isLatest = true;
          hasOverlappingRecentMessagesRef.current = false;
          clearInterval(mergeSetsIntervalRef.current);
        }
        return true;
      }
    }
    return false;
  });

  const mergeSetsIntervalRef = useRef<NodeJS.Timeout>();

  // clear the interval on unmount
  useEffect(
    () => () => {
      clearInterval(mergeSetsIntervalRef.current);
    },
    [],
  );

  // if we had split the latest and current message set, we try to merge them back
  // temporarily commented out the interval as it was causing issues with jankiness during scrolling
  const restartSetsMergeFuncRef = useRef(() => {
    clearInterval(mergeSetsIntervalRef.current);
    if (!hasOverlappingRecentMessagesRef.current) return;
    // mergeSetsIntervalRef.current = setInterval(() => {
    //   const currentLength = channel.state.messages.length || 0;
    //   const didMerge = mergeOverlappingMessageSetsRef.current(true);
    //   if (didMerge && channel.state.messages.length !== currentLength) {
    //     setMessages(channel.state.messages);
    //   }
    // }, 1000);
  });

  /**
   * Shows the latest messages from the channel state
   * If recent messages are empty, fetches new
   * @param clearLatest If true, clears the latest messages before loading (useful for complete refresh)
   */
  const loadLatestMessagesRef = useRef(async (clearLatest = false) => {
    mergeOverlappingMessageSetsRef.current();
    if (clearLatest) {
      const latestSet = channel.state.messageSets.find((set) => set.isLatest);
      if (latestSet) latestSet.messages = [];
    }
    if (channel.state.latestMessages.length === 0) {
      await channel.query({}, 'latest');
    }
    await channel.state.loadMessageIntoState('latest');
  });

  const loadChannel = () =>
    channelQueryCallRef.current(
      async () => {
        if (!channel?.initialized || !channel.state.isUpToDate) {
          await channel?.watch();
        } else {
          await channel.state.loadMessageIntoState('latest');
        }
      },
      () => {
        channel?.state.setIsUpToDate(true);
        setHasNoMoreRecentMessagesToLoad(true);
      },
    );

  const reloadThread = async () => {
    if (!channel || !thread?.id) return;
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
    if (!channel || syncingChannelRef.current) return;
    hasOverlappingRecentMessagesRef.current = false;
    clearInterval(mergeSetsIntervalRef.current);
    syncingChannelRef.current = true;

    setError(false);
    try {
      /**
       * Allow a buffer of 30 new messages, so that MessageList won't move its scroll position,
       * giving smooth user experience.
       */
      const state = await channel.watch({
        messages: {
          limit: messages.length + 30,
        },
      });

      const oldListTopMessage = messages[0];
      const oldListTopMessageId = messages[0]?.id;
      const oldListBottomMessage = messages[messages.length - 1];

      const newListTopMessage = state.messages[0];
      const newListBottomMessage = state.messages[state.messages.length - 1];

      if (
        !oldListTopMessage || // previous list was empty
        !oldListBottomMessage || // previous list was empty
        !newListTopMessage || // new list is truncated
        !newListBottomMessage // new list is truncated
      ) {
        /** Channel was truncated */
        channel.state.clearMessages();
        channel.state.setIsUpToDate(true);
        channel.state.addMessagesSorted(state.messages);
        channel.state.addPinnedMessages(state.pinned_messages);

        copyChannelState();
        return;
      }

      const parseMessage = (message: typeof oldListTopMessage) =>
        ({
          ...message,
          created_at: message.created_at.toString(),
          pinned_at: message.pinned_at?.toString(),
          updated_at: message.updated_at?.toString(),
        } as unknown as MessageResponse<StreamChatGenerics>);

      const failedMessages = messages
        .filter((message) => message.status === MessageStatusTypes.FAILED)
        .map(parseMessage);

      const failedThreadMessages = thread
        ? threadMessages
            .filter((message) => message.status === MessageStatusTypes.FAILED)
            .map(parseMessage)
        : [];

      const oldListTopMessageCreatedAt = oldListTopMessage.created_at;
      const oldListBottomMessageCreatedAt = oldListBottomMessage.created_at;
      const newListTopMessageCreatedAt = newListTopMessage.created_at
        ? new Date(newListTopMessage.created_at)
        : new Date();
      const newListBottomMessageCreatedAt = newListBottomMessage?.created_at
        ? new Date(newListBottomMessage.created_at)
        : new Date();

      let finalMessages = [];

      if (
        oldListTopMessage &&
        oldListTopMessageCreatedAt &&
        oldListBottomMessageCreatedAt &&
        newListTopMessageCreatedAt < oldListTopMessageCreatedAt &&
        newListBottomMessageCreatedAt >= oldListBottomMessageCreatedAt
      ) {
        const index = state.messages.findIndex((message) => message.id === oldListTopMessageId);
        finalMessages = state.messages.slice(index);
      } else {
        finalMessages = state.messages;
      }

      channel.state.setIsUpToDate(true);
      channel.state.clearMessages();
      channel.state.addMessagesSorted(finalMessages);
      channel.state.addPinnedMessages(state.pinned_messages);
      setHasNoMoreRecentMessagesToLoad(true);
      setHasMore(true);
      copyChannelState();

      if (failedMessages.length) {
        channel.state.addMessagesSorted(failedMessages);
        copyChannelState();
      }

      await reloadThread();

      if (thread && failedThreadMessages.length) {
        channel.state.addMessagesSorted(failedThreadMessages);
        setThreadMessages([...channel.state.threads[thread.id]]);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
      setLoading(false);
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

  const reloadChannel = () =>
    channelQueryCallRef.current(async () => {
      setLoading(true);
      await loadLatestMessagesRef.current(true);
      setLoading(false);
      channel?.state.setIsUpToDate(true);
      setHasNoMoreRecentMessagesToLoad(true);
    });

  /**
   * @deprecated
   * Makes a query to load messages at particular message id.
   *
   * @param messageId Targeted message id
   * @param before Number of messages to load before messageId
   * @param after Number of messages to load after messageId
   */
  const queryAtMessage = async ({
    after = 10,
    before = 10,
    messageId,
  }: Parameters<ChannelContextValue<StreamChatGenerics>['loadChannelAtMessage']>[0]) => {
    if (!channel) return;
    channel.state.setIsUpToDate(false);
    hasOverlappingRecentMessagesRef.current = false;
    clearInterval(mergeSetsIntervalRef.current);
    channel.state.clearMessages();
    setMessages([]);
    if (!messageId) {
      await channel.query({
        messages: {
          limit: before,
        },
        watch: true,
      });

      channel.state.setIsUpToDate(true);
      return;
    }

    await queryBeforeMessage(messageId, before);
    await queryAfterMessage(messageId, after);
  };

  /**
   * @deprecated
   * Makes a query to load messages before particular message id.
   *
   * @param messageId Targeted message id
   * @param limit Number of messages to load
   */
  const queryBeforeMessage = async (messageId: string, limit = 5) => {
    if (!channel) return;

    await channel.query({
      messages: {
        id_lt: messageId,
        limit,
      },
      watch: true,
    });

    channel.state.setIsUpToDate(false);
  };

  /**
   * @deprecated
   * Makes a query to load messages later than particular message id.
   *
   * @param messageId Targeted message id
   * @param limit Number of messages to load.
   */
  const queryAfterMessage = async (messageId: string, limit = 5) => {
    if (!channel) return;
    const state = await channel.query({
      messages: {
        id_gte: messageId,
        limit,
      },
      watch: true,
    });

    if (state.messages.length < limit) {
      // make current set as the latest
      const currentSet = channel.state.messageSets.find((set) => set.isCurrent);
      if (currentSet && !currentSet.isLatest) {
        channel.state.messageSets = channel.state.messageSets.filter((set) => !set.isLatest);
        currentSet.isLatest = true;
      }
      channel.state.setIsUpToDate(true);
      setHasNoMoreRecentMessagesToLoad(true);
    } else {
      splitLatestCurrentMessageSetRef.current();
      channel.state.setIsUpToDate(false);
      setHasNoMoreRecentMessagesToLoad(false);
    }
  };

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

  /**
   * MESSAGE METHODS
   */

  const updateMessage: MessagesContextValue<StreamChatGenerics>['updateMessage'] = (
    updatedMessage,
    extraState = {},
  ) => {
    if (channel) {
      channel.state.addMessageSorted(updatedMessage, true);
      if (thread && updatedMessage.parent_id) {
        extraState.threadMessages = channel.state.threads[updatedMessage.parent_id] || [];
        setThreadMessages(extraState.threadMessages);
      }

      setMessages([...channel.state.messages]);
    }
  };

  const replaceMessage = (
    oldMessage: MessageResponse<StreamChatGenerics>,
    newMessage: MessageResponse<StreamChatGenerics>,
  ) => {
    if (channel) {
      channel.state.removeMessage(oldMessage);
      channel.state.addMessageSorted(newMessage, true);
      if (thread && newMessage.parent_id) {
        const threadMessages = channel.state.threads[newMessage.parent_id] || [];
        setThreadMessages(threadMessages);
      }
      setMessages(channel.state.messages);
    }
  };

  const createMessagePreview = ({
    attachments,
    mentioned_users,
    parent_id,
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
      const quotedMessage = messages.find((message) => message.id === preview.quoted_message_id);

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

          dbApi.updateMessage({
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
          dbApi.updateMessage({
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
      if (!channel.id) return;

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
          dbApi.updateMessage({
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
        dbApi.updateMessage({
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

    mergeOverlappingMessageSetsRef.current();

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
      dbApi.upsertMessages({
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

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreFinished = useRef(
    debounce(
      (updatedHasMore: boolean, newMessages: ChannelState<StreamChatGenerics>['messages']) => {
        setLoading(false);
        setLoadingMore(false);
        setError(false);
        setHasMore(updatedHasMore);
        setMessages(newMessages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  /**
   * This function loads more messages before the first message in current channel state.
   */
  const loadMore = useCallback<PaginatedMessageListContextValue<StreamChatGenerics>['loadMore']>(
    async (limit = 20) => {
      if (loadingMore || hasMore === false) {
        return;
      }

      const currentMessages = channel.state.messages;

      if (!currentMessages.length) {
        return setLoadingMore(false);
      }

      const oldestMessage = currentMessages && currentMessages[0];

      if (oldestMessage && oldestMessage.status !== MessageStatusTypes.RECEIVED) {
        return setLoadingMore(false);
      }

      setLoadingMore(true);

      const oldestID = oldestMessage && oldestMessage.id;

      try {
        if (channel) {
          const queryResponse = await channel.query({
            messages: { id_lt: oldestID, limit },
          });

          const updatedHasMore = queryResponse.messages.length === limit;
          loadMoreFinished(updatedHasMore, channel.state.messages);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(true);
        }
        setLoadingMore(false);
        throw err;
      }
    },
    /*
     * This function is passed to useCreatePaginatedMessageListContext
     * Where the deps are [channelId, hasMore, loadingMoreRecent, loadingMore]
     * and only those deps should be used here because of that
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, hasMore, loadingMore],
  );

  /**
   * This function loads more messages after the most recent message in current channel state.
   */
  const loadMoreRecent = useCallback<
    PaginatedMessageListContextValue<StreamChatGenerics>['loadMoreRecent']
  >(
    async (limit = 5) => {
      const latestMessageSet = channel.state.messageSets.find((set) => set.isLatest);
      const latestLengthBeforeMerge = latestMessageSet?.messages.length || 0;
      const didMerge = mergeOverlappingMessageSetsRef.current(true);
      if (didMerge) {
        if (latestMessageSet && latestLengthBeforeMerge >= limit) {
          setLoadingMoreRecent(true);
          channel.state.setIsUpToDate(true);
          setHasNoMoreRecentMessagesToLoad(true);
          loadMoreRecentFinished(channel.state.messages);
          restartSetsMergeFuncRef.current();
          return;
        }
      }
      if (channel.state.isUpToDate) {
        setLoadingMoreRecent(false);
        return;
      }
      const currentMessages = channel.state.messages;
      const recentMessage = currentMessages[currentMessages.length - 1];

      if (recentMessage?.status !== MessageStatusTypes.RECEIVED) {
        setLoadingMoreRecent(false);
        return;
      }
      setLoadingMoreRecent(true);
      try {
        if (channel) {
          const queryResponse = await channel.query({
            messages: {
              id_gte: recentMessage.id,
              limit,
            },
            watch: true,
          });
          const gotAllRecentMessages = queryResponse.messages.length < limit;
          const currentSet = channel.state.messageSets.find((set) => set.isCurrent);
          if (gotAllRecentMessages && currentSet && !currentSet.isLatest) {
            channel.state.messageSets = channel.state.messageSets.filter((set) => !set.isLatest);
            // make current set as the latest
            currentSet.isLatest = true;
          }
          channel.state.setIsUpToDate(gotAllRecentMessages);
          setHasNoMoreRecentMessagesToLoad(gotAllRecentMessages);
          loadMoreRecentFinished(channel.state.messages);
        }
      } catch (err) {
        console.warn('Message pagination request failed with error', err);
        if (err instanceof Error) {
          setError(err);
        } else {
          setError(true);
        }
        setLoadingMoreRecent(false);
        throw err;
      }
    },
    /*
     * This function is passed to useCreatePaginatedMessageListContext
     * Where the deps are [channelId, hasMore, loadingMoreRecent, loadingMore, hasNoMoreRecentMessagesToLoad]
     * and and only those deps should be used here because of that
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [channelId, hasNoMoreRecentMessagesToLoad],
  );

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreRecentFinished = useRef(
    debounce(
      (newMessages: ChannelState<StreamChatGenerics>['messages']) => {
        setLoadingMoreRecent(false);
        setMessages(newMessages);
        setError(false);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

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
    () => setQuotedMessage(false);

  /**
   * Removes the message from local state
   */
  const removeMessage: MessagesContextValue<StreamChatGenerics>['removeMessage'] = (message) => {
    if (channel) {
      channel.state.removeMessage(message);
      setMessages(channel.state.messages);
      if (thread) {
        setThreadMessages(channel.state.threads[thread.id] || []);
      }
    }

    if (enableOfflineSupport) {
      dbApi.deleteMessage({
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

    setMessages(channel.state.messages);

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
        removeMessage(message);
        return;
      }
      await client.deleteMessage(message.id);
      return;
    }

    if (message.status === MessageStatusTypes.FAILED) {
      DBSyncManager.dropPendingTasks({ messageId: message.id });
      removeMessage(message);
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

    setMessages(channel.state.messages);

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

  const disabledValue = useMemo(
    () => !!channel?.data?.frozen && disableIfFrozenChannel,
    [channel.data?.frozen, disableIfFrozenChannel],
  );

  const ownCapabilitiesContext = useCreateOwnCapabilitiesContext({
    channel,
    overrideCapabilities: overrideOwnCapabilities,
  });

  const channelContext = useCreateChannelContext({
    channel,
    disabled: disabledValue,
    EmptyStateIndicator,
    enableMessageGroupingByUser,
    enforceUniqueReaction,
    error,
    giphyEnabled:
      giphyEnabled ??
      !!(clientChannelConfig?.commands || [])?.some((command) => command.name === 'giphy'),
    hideDateSeparators,
    hideStickyDateHeader,
    isAdmin,
    isChannelActive: shouldSyncChannel,
    isModerator,
    isOwner,
    lastRead,
    loadChannelAroundMessage,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    markRead,
    maxTimeBetweenGroupedMessages,
    members,
    NetworkDownIndicator,
    read,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    setLastRead,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    threadList,
    uploadAbortControllerRef,
    watcherCount,
    watchers,
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
    quotedMessage,
    SendButton,
    sendImageAsync,
    sendMessage: (...args) => sendMessageRef.current(...args),
    SendMessageDisallowedIndicator,
    setInputRef,
    setQuotedMessageState,
    ShowThreadMessageInChannelButton,
    StartAudioRecordingButton,
    UploadProgressIndicator,
  });

  const messageListContext = useCreatePaginatedMessageListContext({
    channelId,
    hasMore,
    hasNoMoreRecentMessagesToLoad,
    loadingMore: loadingMoreProp !== undefined ? loadingMoreProp : loadingMore,
    loadingMoreRecent:
      loadingMoreRecentProp !== undefined ? loadingMoreRecentProp : loadingMoreRecent,
    loadMore,
    loadMoreRecent,
    messages,
    setLoadingMore,
    setLoadingMoreRecent,
  });

  const messagesContext = useCreateMessagesContext({
    additionalTouchableProps,
    Attachment,
    AttachmentActions,
    AudioAttachment,
    Card,
    CardCover,
    CardFooter,
    CardHeader,
    channelId,
    DateHeader,
    deletedMessagesVisibilityType,
    deleteMessage,
    deleteReaction,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch,
    enableMessageGroupingByUser,
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
    handleBlock,
    handleCopy,
    handleDelete,
    handleEdit,
    handleFlag,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    ImageLoadingFailedIndicator,
    ImageLoadingIndicator,
    initialScrollToFirstUnreadMessage: !messageId && initialScrollToFirstUnreadMessage, // when messageId is set, we scroll to the messageId instead of first unread
    InlineDateSeparator,
    InlineUnreadIndicator,
    isAttachmentEqual,
    legacyImageViewerSwipeBehaviour,
    markdownRules,
    Message,
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
    MessagePinnedHeader,
    MessageReplies,
    MessageRepliesAvatars,
    MessageSimple,
    MessageStatus,
    MessageSystem,
    MessageText,
    MessageTimestamp,
    myMessageTheme,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    OverlayReactionList,
    ReactionList,
    removeMessage,
    Reply,
    retrySendMessage,
    ScrollToBottomButton,
    selectReaction,
    sendReaction,
    setEditingState,
    setQuotedMessageState,
    supportedReactions,
    targetedMessage,
    TypingIndicator,
    TypingIndicatorContainer,
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
    typing,
  });

  // TODO: replace the null view with appropriate message. Currently this is waiting a design decision.
  if (deleted) return null;

  if (!channel || (error && messages.length === 0)) {
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
> = Partial<Omit<ChannelPropsWithContext<StreamChatGenerics>, 'channel'>> &
  Pick<ChannelPropsWithContext<StreamChatGenerics>, 'channel'>;

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
  const { client, enableOfflineSupport } = useChatContext<StreamChatGenerics>();
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

  const {
    members,
    messages,
    read,
    setMembers,
    setMessages,
    setRead,
    setThreadMessages,
    setTyping,
    setWatcherCount,
    setWatchers,
    threadMessages,
    typing,
    watcherCount,
    watchers,
  } = useChannelState<StreamChatGenerics>(
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
        members,
        messages: props.messages || messages,
        read,
        setMembers,
        setMessages,
        setRead,
        setThreadMessages,
        setTyping,
        setWatcherCount,
        setWatchers,
        thread,
        threadMessages,
        typing,
        watcherCount,
        watchers,
      }}
    />
  );
};
