import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingViewProps, StyleSheet, Text, View } from 'react-native';

import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import {
  ChannelState,
  Channel as ChannelType,
  ConnectionChangeEvent,
  EventHandler,
  logChatPromiseExecution,
  MessageResponse,
  SendMessageAPIResponse,
  StreamChat,
  Event as StreamEvent,
  Message as StreamMessage,
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
import { useChannelState } from '../../contexts/channelsStateContext/useChannelState';
import type { UseChannelStateValue } from '../../contexts/channelsStateContext/useChannelState';
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
import { ThreadContextValue, ThreadProvider } from '../../contexts/threadContext/ThreadContext';
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
import { FlatList as FlatListDefault } from '../../native';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { generateRandomId, MessageStatusTypes, ReactionData } from '../../utils/utils';
import { Attachment as AttachmentDefault } from '../Attachment/Attachment';
import { AttachmentActions as AttachmentActionsDefault } from '../Attachment/AttachmentActions';
import { Card as CardDefault } from '../Attachment/Card';
import { FileAttachment as FileAttachmentDefault } from '../Attachment/FileAttachment';
import { FileAttachmentGroup as FileAttachmentGroupDefault } from '../Attachment/FileAttachmentGroup';
import { FileIcon as FileIconDefault } from '../Attachment/FileIcon';
import { Gallery as GalleryDefault } from '../Attachment/Gallery';
import { Giphy as GiphyDefault } from '../Attachment/Giphy';
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
import { MessageContent as MessageContentDefault } from '../Message/MessageSimple/MessageContent';
import { MessageDeleted as MessageDeletedDefault } from '../Message/MessageSimple/MessageDeleted';
import { MessageFooter as MessageFooterDefault } from '../Message/MessageSimple/MessageFooter';
import { MessagePinnedHeader as MessagePinnedHeaderDefault } from '../Message/MessageSimple/MessagePinnedHeader';
import { MessageReplies as MessageRepliesDefault } from '../Message/MessageSimple/MessageReplies';
import { MessageRepliesAvatars as MessageRepliesAvatarsDefault } from '../Message/MessageSimple/MessageRepliesAvatars';
import { MessageSimple as MessageSimpleDefault } from '../Message/MessageSimple/MessageSimple';
import { MessageStatus as MessageStatusDefault } from '../Message/MessageSimple/MessageStatus';
import { ReactionList as ReactionListDefault } from '../Message/MessageSimple/ReactionList';
import { AttachButton as AttachButtonDefault } from '../MessageInput/AttachButton';
import { CommandsButton as CommandsButtonDefault } from '../MessageInput/CommandsButton';
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
  Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
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
      | 'formatDate'
      | 'Gallery'
      | 'Giphy'
      | 'giphyVersion'
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
      | 'markdownRules'
      | 'Message'
      | 'messageActions'
      | 'MessageAvatar'
      | 'MessageContent'
      | 'messageContentOrder'
      | 'MessageDeleted'
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
  Partial<
    Pick<ThreadContextValue<StreamChatGenerics>, 'allowThreadMessagesInChannel' | 'thread'>
  > & {
    shouldSyncChannel: boolean;
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
    AttachButton = AttachButtonDefault,
    Attachment = AttachmentDefault,
    AttachmentActions = AttachmentActionsDefault,
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
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    enableMessageGroupingByUser = true,
    enforceUniqueReaction = false,
    FileAttachment = FileAttachmentDefault,
    FileAttachmentGroup = FileAttachmentGroupDefault,
    FileAttachmentIcon = FileIconDefault,
    FileUploadPreview = FileUploadPreviewDefault,
    FlatList = FlatListDefault,
    forceAlignMessages,
    formatDate,
    Gallery = GalleryDefault,
    Giphy = GiphyDefault,
    giphyEnabled,
    giphyVersion = 'fixed_height',
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
    hasCommands = true,
    hasFilePicker = true,
    hasImagePicker = true,
    hideDateSeparators = false,
    hideStickyDateHeader = false,
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
    mentionAllAppUsersEnabled = false,
    mentionAllAppUsersQuery,
    members,
    Message = MessageDefault,
    messageActions,
    MessageAvatar = MessageAvatarDefault,
    MessageContent = MessageContentDefault,
    messageContentOrder = ['quoted_reply', 'gallery', 'files', 'text', 'attachments'],
    MessageDeleted = MessageDeletedDefault,
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
    MoreOptionsButton = MoreOptionsButtonDefault,
    myMessageTheme,
    newMessageStateUpdateThrottleInterval = defaultThrottleInterval,
    NetworkDownIndicator = NetworkDownIndicatorDefault,
    numberOfLines = 5,
    onChangeText,
    onLongPressMessage,
    overrideOwnCapabilities,
    onPressInMessage,
    onPressMessage,
    OverlayReactionList = OverlayReactionListDefault,
    ReactionList = ReactionListDefault,
    read,
    Reply = ReplyDefault,
    ScrollToBottomButton = ScrollToBottomButtonDefault,
    selectReaction,
    SendButton = SendButtonDefault,
    SendMessageDisallowedIndicator = SendMessageDisallowedIndicatorDefault,
    sendImageAsync = false,
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
    stateUpdateThrottleInterval = defaultThrottleInterval,
    StickyHeader,
    supportedReactions = reactionData,
    t,
    thread: threadProps,
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

  const {
    theme: {
      channel: { selectChannel },
      colors: { black },
    },
  } = useTheme();
  const [deleted, setDeleted] = useState(false);
  const [editing, setEditing] = useState<boolean | MessageType<StreamChatGenerics>>(false);
  const [error, setError] = useState<Error | boolean>(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastRead, setLastRead] = useState<ChannelContextValue<StreamChatGenerics>['lastRead']>();
  const [loading, setLoading] = useState(!channel?.state.messages.length);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
  const [quotedMessage, setQuotedMessage] =
    useState<boolean | MessageType<StreamChatGenerics>>(false);
  const [thread, setThread] = useState<ThreadContextValue<StreamChatGenerics>['thread']>(
    threadProps || null,
  );
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);

  const [syncingChannel, setSyncingChannel] = useState(false);

  /**
   * Flag to track if we know for sure that there are no more recent messages to load.
   * This is necessary to avoid unnecessary api calls to load recent messages on pagination.
   */
  const [hasNoMoreRecentMessagesToLoad, setHasNoMoreRecentMessagesToLoad] = useState(true);

  const { setTargetedMessage, targetedMessage } = useTargetedMessage();

  const channelId = channel?.id || '';
  useEffect(() => {
    const initChannel = () => {
      if (!channel || !shouldSyncChannel) return;
      /**
       * Loading channel at first unread message  requires channel to be initialized in the first place,
       * since we use read state on channel to decide what offset to load channel at.
       * Also there is no use case from UX perspective, why one would need loading uninitialized channel at particular message.
       * If the channel is not initiated, then we need to do channel.watch, which is more expensive for backend than channel.query.
       */
      if (!channel.initialized) {
        loadChannel();
        return;
      }

      if (messageId) {
        loadChannelAroundMessage({ messageId });
        return;
      }

      if (
        initialScrollToFirstUnreadMessage &&
        channel.countUnread() > scrollToFirstUnreadThreshold
      ) {
        loadChannelAtFirstUnreadMessage();
      } else {
        loadChannel();
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
  }, [threadPropsExists]);

  const handleAppBackground = useCallback(() => {
    if (channel) {
      channel.sendEvent({
        parent_id: thread?.id,
        type: 'typing.stop',
      } as StreamEvent<StreamChatGenerics>);
    }
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
          setMessages([...channel.state.messages]);
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

  const connectionRecoveredHandler = () => {
    if (channel && shouldSyncChannel) {
      copyChannelState();
      if (thread) {
        setThreadMessages([...channel.state.threads[thread.id]]);
      }
    }
  };

  const connectionChangedHandler = (event: ConnectionChangeEvent) => {
    if (event.online && shouldSyncChannel) {
      resyncChannel();
    }
  };

  const handleEvent: EventHandler<StreamChatGenerics> = (event) => {
    if (shouldSyncChannel) {
      if (thread) {
        const updatedThreadMessages =
          (thread.id && channel && channel.state.threads[thread.id]) || threadMessages;
        setThreadMessages(updatedThreadMessages);
      }

      if (channel && thread && event.message?.id === thread.id) {
        const updatedThread = channel.state.formatMessage(event.message);
        setThread(updatedThread);
      }

      if (event.type === 'typing.start' || event.type === 'typing.stop') {
        copyTypingState();
      } else if (event.type === 'message.read') {
        copyReadState();
      } else if (event.type === 'message.new') {
        copyMessagesState();
      } else if (channel) {
        copyChannelState();
      }
    }
  };

  useEffect(() => {
    const channelSubscriptions: Array<ReturnType<ChannelType['on']>> = [];
    const clientSubscriptions: Array<ReturnType<StreamChat['on']>> = [];

    const subscribe = () => {
      if (!channel) return;

      /**
       * The more complex sync logic around internet connectivity (NetInfo) is part of Chat.tsx
       * listen to client.connection.recovered and all channel events
       */
      clientSubscriptions.push(client.on('connection.recovered', connectionRecoveredHandler));
      clientSubscriptions.push(client.on('connection.changed', connectionChangedHandler));
      clientSubscriptions.push(
        client.on('channel.deleted', (event) => {
          if (event.cid === channel.cid) {
            setDeleted(true);
          }
        }),
      );
      channelSubscriptions.push(channel.on(handleEvent));
    };

    subscribe();

    return () => {
      clientSubscriptions.forEach((s) => s.unsubscribe());
      channelSubscriptions.forEach((s) => s.unsubscribe());
    };
  }, [channelId, connectionChangedHandler, connectionRecoveredHandler, handleEvent]);

  const channelQueryCallRef = useRef(async (queryCall: () => void = () => null) => {
    setError(false);
    try {
      await queryCall();
      setLastRead(new Date());
      setHasMore(true);
      copyChannelState();
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
      setLoading(false);
      setLastRead(new Date());
    }
  });

  /**
   * Loads channel at first unread message.
   */
  const loadChannelAtFirstUnreadMessage = () => {
    if (!channel) return;
    const unreadCount = channel.countUnread();
    if (unreadCount <= scrollToFirstUnreadThreshold) return;
    // temporarily clear existing messages so that messageList component gets a list change and does not scroll to any unread message first before loading completes
    setMessages([]);
    // query for messages around the last read date
    return channelQueryCallRef.current(async () => {
      setLoading(true);
      const lastReadDate = channel.lastRead() || new Date(0);
      await channel.query({
        messages: {
          created_at_around: lastReadDate,
          limit: 25,
        },
      });
      setLoading(false);
    });
  };

  /**
   * Loads channel around a specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   */
  const loadChannelAroundMessage: ChannelContextValue<StreamChatGenerics>['loadChannelAroundMessage'] =
    ({ messageId }) =>
      channelQueryCallRef.current(async () => {
        setHasNoMoreRecentMessagesToLoad(false); // we are jumping to a message, hence we do not know for sure anymore if there are no more recent messages
        setLoading(true);
        if (messageId) {
          await channel.state.loadMessageIntoState(messageId);
          setTargetedMessage(messageId);
        } else {
          await channel.state.loadMessageIntoState('latest');
          channel.state.setIsUpToDate(true);
        }
        setLoading(false);
      });

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

  const loadChannel = () =>
    channelQueryCallRef.current(async () => {
      if (!channel?.initialized || !channel.state.isUpToDate) {
        await channel?.watch();
        setHasNoMoreRecentMessagesToLoad(true);
        channel?.state.setIsUpToDate(true);
      } else {
        await channel.state.loadMessageIntoState('latest');
      }
      return;
    });

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
      if (threadMessage) {
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
    if (!channel || syncingChannel) return;
    setSyncingChannel(true);

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

      setHasNoMoreRecentMessagesToLoad(true);
      channel.state.setIsUpToDate(true);

      channel.state.clearMessages();
      channel.state.addMessagesSorted(finalMessages);

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

    setSyncingChannel(false);
  };

  const reloadChannel = () =>
    channelQueryCallRef.current(async () => {
      setLoading(true);
      await channel.state.loadMessageIntoState('latest');
      setLoading(false);
      setHasNoMoreRecentMessagesToLoad(true);
      channel?.state.setIsUpToDate(true);
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
    channel.state.clearMessages();
    setMessages([...channel.state.messages]);
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
      channel.state.setIsUpToDate(true);
    } else {
      channel.state.setIsUpToDate(false);
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
        id: client.userID,
        ...client.user,
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

  const sendMessageRequest = async (
    message: MessageResponse<StreamChatGenerics>,
    retrying?: boolean,
  ) => {
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      __html,
      attachments,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      created_at,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      html,
      id,
      mentioned_users,
      parent_id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      quoted_message,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      reactions,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      status,
      text,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      type,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updated_at,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      user,
      ...extraFields
    } = message;

    const messageData = {
      attachments,
      id: retrying ? undefined : id,
      mentioned_users: mentioned_users?.map((mentionedUser) => mentionedUser.id) || [],
      parent_id,
      text,
      ...extraFields,
    } as StreamMessage<StreamChatGenerics>;

    try {
      let messageResponse = {} as SendMessageAPIResponse<StreamChatGenerics>;

      if (doSendMessageRequest) {
        messageResponse = await doSendMessageRequest(channel?.cid || '', messageData);
      } else if (channel) {
        messageResponse = await channel.sendMessage(messageData);
      }
      if (messageResponse.message) {
        messageResponse.message.status = MessageStatusTypes.RECEIVED;
        if (retrying) {
          replaceMessage(message, messageResponse.message);
        } else {
          updateMessage(messageResponse.message);
        }
      }
    } catch (err) {
      console.log(err);
      message.status = MessageStatusTypes.FAILED;
      updateMessage(message);
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

    if (!channel?.state.isUpToDate) {
      await reloadChannel();
    }

    updateMessage(messagePreview, {
      commands: [],
      messageInput: '',
    });

    await sendMessageRequest(messagePreview);
  };

  const retrySendMessage: MessagesContextValue<StreamChatGenerics>['retrySendMessage'] = async (
    message,
  ) => {
    const statusPendingMessage = {
      ...message,
      status: MessageStatusTypes.SENDING,
    };

    updateMessage(statusPendingMessage);
    await sendMessageRequest(statusPendingMessage, true);
  };

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreFinished = useRef(
    debounce(
      (updatedHasMore: boolean, newMessages: ChannelState<StreamChatGenerics>['messages']) => {
        setLoadingMore(false);
        setError(false);
        setHasMore(updatedHasMore);
        setMessages(newMessages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  const loadMore: PaginatedMessageListContextValue<StreamChatGenerics>['loadMore'] = async (
    limit = 20,
  ) => {
    if (loadingMore || hasMore === false) {
      return;
    }
    setLoadingMore(true);

    if (!messages.length) {
      return setLoadingMore(false);
    }

    const oldestMessage = messages && messages[0];

    if (oldestMessage && oldestMessage.status !== MessageStatusTypes.RECEIVED) {
      return setLoadingMore(false);
    }

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
  };

  const loadMoreRecent: PaginatedMessageListContextValue<StreamChatGenerics>['loadMoreRecent'] =
    async (limit = 5) => {
      if (hasNoMoreRecentMessagesToLoad) {
        return;
      }

      setLoadingMoreRecent(true);

      const recentMessage = messages[messages.length - 1];

      if (recentMessage?.status !== MessageStatusTypes.RECEIVED) {
        setLoadingMoreRecent(false);
        return;
      }

      try {
        if (channel) {
          const state = await channel.query({
            messages: {
              id_gte: recentMessage.id,
              limit,
            },
            watch: true,
          });
          setHasNoMoreRecentMessagesToLoad(state.messages.length < limit);
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
    };

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
    setEditing(message);
  };

  const setQuotedMessageState: MessagesContextValue<StreamChatGenerics>['setQuotedMessageState'] = (
    message,
  ) => {
    setQuotedMessage(message);
  };

  const clearEditingState: InputMessageInputContextValue<StreamChatGenerics>['clearEditingState'] =
    () => setEditing(false);

  const clearQuotedMessageState: InputMessageInputContextValue<StreamChatGenerics>['clearQuotedMessageState'] =
    () => setQuotedMessage(false);

  const removeMessage: MessagesContextValue<StreamChatGenerics>['removeMessage'] = (message) => {
    if (channel) {
      channel.state.removeMessage(message);
      setMessages(channel.state.messages);
      if (thread) {
        setThreadMessages(channel.state.threads[thread.id] || []);
      }
    }
  };

  /**
   * THREAD METHODS
   */
  const openThread: ThreadContextValue<StreamChatGenerics>['openThread'] = (message) => {
    const newThreadMessages = message?.id ? channel?.state?.threads[message.id] || [] : [];
    setThread(message);
    setThreadMessages(newThreadMessages);
  };

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

  const channelContext = useCreateChannelContext({
    channel,
    disabled: !!channel?.data?.frozen && disableIfFrozenChannel,
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
    watcherCount,
    watchers,
  });

  const inputMessageInputContext = useCreateInputMessageInputContext<StreamChatGenerics>({
    additionalTextInputProps,
    AttachButton,
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
    FileUploadPreview,
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
    sendMessage,
    SendMessageDisallowedIndicator,
    setInputRef,
    setQuotedMessageState,
    ShowThreadMessageInChannelButton,
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
    Card,
    CardCover,
    CardFooter,
    CardHeader,
    channelId,
    DateHeader,
    deletedMessagesVisibilityType,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch,
    enableMessageGroupingByUser,
    FileAttachment,
    FileAttachmentGroup,
    FileAttachmentIcon,
    FlatList,
    forceAlignMessages,
    formatDate,
    Gallery,
    Giphy,
    giphyVersion,
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
    initialScrollToFirstUnreadMessage,
    InlineDateSeparator,
    InlineUnreadIndicator,
    isAttachmentEqual,
    legacyImageViewerSwipeBehaviour,
    markdownRules,
    Message,
    messageActions,
    MessageAvatar,
    MessageContent,
    messageContentOrder,
    MessageDeleted,
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
        {t('Please select a channel first')}
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
  const { client } = useChatContext<StreamChatGenerics>();
  const { t } = useTranslationContext();

  const shouldSyncChannel = props.thread?.id ? !!props.threadList : true;

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
    props.threadList ? props.thread?.id : undefined,
  );

  return (
    <ChannelWithContext<StreamChatGenerics>
      {...{
        client,
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
        threadMessages,
        typing,
        watcherCount,
        watchers,
      }}
    />
  );
};
