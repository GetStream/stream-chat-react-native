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

import { useAppStateListener } from '../../hooks/useAppStateListener';
import { useCreateChannelContext } from './hooks/useCreateChannelContext';
import { useCreateInputMessageInputContext } from './hooks/useCreateInputMessageInputContext';
import { useCreateMessagesContext } from './hooks/useCreateMessagesContext';
import { useCreatePaginatedMessageListContext } from './hooks/useCreatePaginatedMessageListContext';
import { useCreateThreadContext } from './hooks/useCreateThreadContext';
import { useCreateTypingContext } from './hooks/useCreateTypingContext';
import { useTargetedMessage } from './hooks/useTargetedMessage';

import { Attachment as AttachmentDefault } from '../Attachment/Attachment';
import { AttachmentActions as AttachmentActionsDefault } from '../Attachment/AttachmentActions';
import { Card as CardDefault } from '../Attachment/Card';
import { FileAttachment as FileAttachmentDefault } from '../Attachment/FileAttachment';
import { FileAttachmentGroup as FileAttachmentGroupDefault } from '../Attachment/FileAttachmentGroup';
import { FileIcon as FileIconDefault } from '../Attachment/FileIcon';
import { Gallery as GalleryDefault } from '../Attachment/Gallery';
import { Giphy as GiphyDefault } from '../Attachment/Giphy';
import { EmptyStateIndicator as EmptyStateIndicatorDefault } from '../Indicators/EmptyStateIndicator';
import {
  LoadingErrorIndicator as LoadingErrorIndicatorDefault,
  LoadingErrorProps,
} from '../Indicators/LoadingErrorIndicator';
import { LoadingIndicator as LoadingIndicatorDefault } from '../Indicators/LoadingIndicator';
import { NetworkDownIndicator as NetworkDownIndicatorDefault } from '../MessageList/NetworkDownIndicator';
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
import { CooldownTimer as CooldownTimerDefault } from '../MessageInput/CooldownTimer';
import { FileUploadPreview as FileUploadPreviewDefault } from '../MessageInput/FileUploadPreview';
import { ImageUploadPreview as ImageUploadPreviewDefault } from '../MessageInput/ImageUploadPreview';
import { InputButtons as InputButtonsDefault } from '../MessageInput/InputButtons';
import { MoreOptionsButton as MoreOptionsButtonDefault } from '../MessageInput/MoreOptionsButton';
import { SendButton as SendButtonDefault } from '../MessageInput/SendButton';
import { ShowThreadMessageInChannelButton as ShowThreadMessageInChannelButtonDefault } from '../MessageInput/ShowThreadMessageInChannelButton';
import { UploadProgressIndicator as UploadProgressIndicatorDefault } from '../MessageInput/UploadProgressIndicator';
import { DateHeader as DateHeaderDefault } from '../MessageList/DateHeader';
import { InlineDateSeparator as InlineDateSeparatorDefault } from '../MessageList/InlineDateSeparator';
import { InlineUnreadIndicator as InlineUnreadIndicatorDefault } from '../MessageList/InlineUnreadIndicator';
import { MessageList as MessageListDefault } from '../MessageList/MessageList';
import { MessageSystem as MessageSystemDefault } from '../MessageList/MessageSystem';
import { ScrollToBottomButton as ScrollToBottomButtonDefault } from '../MessageList/ScrollToBottomButton';
import { TypingIndicator as TypingIndicatorDefault } from '../MessageList/TypingIndicator';
import { TypingIndicatorContainer as TypingIndicatorContainerDefault } from '../MessageList/TypingIndicatorContainer';
import { OverlayReactionList as OverlayReactionListDefault } from '../MessageOverlay/OverlayReactionList';
import { Reply as ReplyDefault } from '../Reply/Reply';

import {
  ChannelConfig,
  ChannelContextValue,
  ChannelProvider,
} from '../../contexts/channelContext/ChannelContext';
import { useChannelState } from '../../contexts/channelsStateContext/useChannelState';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import {
  InputConfig,
  InputMessageInputContextValue,
  MessageInputProvider,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessagesConfig,
  MessagesContextValue,
  MessagesProvider,
} from '../../contexts/messagesContext/MessagesContext';
import {
  PaginatedMessageListContextValue,
  PaginatedMessageListProvider,
} from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import {
  SuggestionsContextValue,
  SuggestionsProvider,
} from '../../contexts/suggestionsContext/SuggestionsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import { useToastContext } from '../../contexts/toastContext/ToastContext';
import { ThreadContextValue, ThreadProvider } from '../../contexts/threadContext/ThreadContext';
import {
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';
import { TypingProvider } from '../../contexts/typingContext/TypingContext';
import {
  LOLReaction,
  LoveReaction,
  ThumbsDownReaction,
  ThumbsUpReaction,
  WutReaction,
} from '../../icons';
import { FlatList as FlatListDefault } from '../../native';
import { StreamCache } from '../../StreamCache';
import { generateRandomId, ReactionData } from '../../utils/utils';

import type { MessageType } from '../MessageList/hooks/useMessageList';
import type { UseChannelStateValue } from '../../contexts/channelsStateContext/useChannelState';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

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

/**
 * Number of unread messages to show in first frame, when channel loads at first
 * unread message. Only applicable if unread count > scrollToFirstUnreadThreshold.
 */
const unreadMessagesOnInitialLoadLimit = 2;

export type ChannelPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<
  Pick<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'channel'
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
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Partial<
    Omit<
      InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      'quotedMessage' | 'editing' | 'clearEditingState' | 'clearQuotedMessageState' | 'sendMessage'
    >
  > &
  Partial<SuggestionsContextValue<Co, Us>> &
  Pick<TranslationContextValue, 't'> &
  Partial<
    Pick<
      PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      'messages' | 'loadingMore' | 'loadingMoreRecent'
    >
  > &
  UseChannelStateValue<At, Ch, Co, Ev, Me, Re, Us> &
  Partial<
    Pick<
      MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
      | 'additionalTouchableProps'
      | 'animatedLongPress'
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
      | 'onDoubleTapMessage'
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
    >
  > &
  Partial<
    Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'allowThreadMessagesInChannel' | 'thread'>
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
     * Channel internally uses the [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx)
     * component to adjust the height of Channel when the keyboard is opened or dismissed. This prop provides the ability to disable this functionality in case you
     * want to use [KeyboardAvoidingView](https://facebook.github.io/react-native/docs/keyboardavoidingview) or handle dismissal yourself.
     * KeyboardAvoidingView works well when your component occupies 100% of screen height, otherwise it may raise some issues.
     */
    disableKeyboardCompatibleView?: boolean;
    /**
     * Overrides the Stream default mark channel read request (Advanced usage only)
     * @param channel Channel object
     */
    doMarkReadRequest?: (channel: ChannelType<At, Ch, Co, Ev, Me, Re, Us>) => void;
    /**
     * Overrides the Stream default send message request (Advanced usage only)
     * @param channelId
     * @param messageData Message object
     */
    doSendMessageRequest?: (
      channelId: string,
      messageData: StreamMessage<At, Me, Us>,
    ) => Promise<SendMessageAPIResponse<At, Ch, Co, Me, Re, Us>>;
    /**
     * Overrides the Stream default update message request (Advanced usage only)
     * @param channelId
     * @param updatedMessage UpdatedMessage object
     */
    doUpdateMessageRequest?: (
      channelId: string,
      updatedMessage: Parameters<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>[0],
    ) => ReturnType<StreamChat<At, Ch, Co, Ev, Me, Re, Us>['updateMessage']>;
    /**
     * E.g. Once unread count exceeds 255, display unread count as 255+ instead of actual count.
     * Also 255 is the limit per Stream chat channel for unread count.
     */
    globalUnreadCountLimit?: number;
    /**
     * When true, messageList will be scrolled at first unread message, when opened.
     */
    initialScrollToFirstUnreadMessage?: boolean;
    keyboardBehavior?: KeyboardAvoidingViewProps['behavior'];
    /**
     * Custom wrapper component that handles height adjustment of Channel component when keyboard is opened or dismissed
     * Default component (accepts the same props): [KeyboardCompatibleView](https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/KeyboardCompatibleView/KeyboardCompatibleView.tsx)
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
    messageId?: string;
    mutesEnabled?: boolean;
    newMessageStateUpdateThrottleInterval?: number;
    pinMessageEnabled?: boolean;
    quotedRepliesEnabled?: boolean;
    reactionsEnabled?: boolean;
    readEventsEnabled?: boolean;
    stateUpdateThrottleInterval?: number;
    /**
     * Tells if channel is rendering a thread list
     */
    threadList?: boolean;
    threadRepliesEnabled?: boolean;
    typingEventsEnabled?: boolean;
    uploadsEnabled?: boolean;
  };

const ChannelWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: PropsWithChildren<ChannelPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const {
    additionalKeyboardAvoidingViewProps,
    additionalTextInputProps,
    additionalTouchableProps,
    allowThreadMessagesInChannel = true,
    animatedLongPress,
    AttachButton = AttachButtonDefault,
    Attachment = AttachmentDefault,
    AttachmentActions = AttachmentActionsDefault,
    autoCompleteSuggestionsLimit,
    autoCompleteTriggerSettings,
    Card = CardDefault,
    CardCover,
    CardFooter,
    CardHeader,
    channel,
    children,
    client,
    closeSuggestions,
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
    globalUnreadCountLimit = 255,
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
    keyboardBehavior,
    KeyboardCompatibleView = KeyboardCompatibleViewDefault,
    keyboardVerticalOffset,
    // TODO[major]: switch to false.
    legacyImageViewerSwipeBehaviour = true,
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
    mutesEnabled: mutesEnabledProp,
    myMessageTheme,
    newMessageStateUpdateThrottleInterval = defaultThrottleInterval,
    NetworkDownIndicator = NetworkDownIndicatorDefault,
    numberOfLines = 5,
    onChangeText,
    onDoubleTapMessage,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    openSuggestions,
    OverlayReactionList = OverlayReactionListDefault,
    pinMessageEnabled: pinMessageEnabledProp,
    quotedRepliesEnabled: quotedRepliesEnabledProp,
    ReactionList = ReactionListDefault,
    reactionsEnabled: reactionsEnabledProp,
    read,
    readEventsEnabled: readEventsEnabledProp,
    Reply = ReplyDefault,
    ScrollToBottomButton = ScrollToBottomButtonDefault,
    selectReaction,
    SendButton = SendButtonDefault,
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
    threadRepliesEnabled: threadRepliesEnabledProp,
    typing,
    typingEventsEnabled: typingEventsEnabledProp,
    TypingIndicator = TypingIndicatorDefault,
    TypingIndicatorContainer = TypingIndicatorContainerDefault,
    updateSuggestions,
    UploadProgressIndicator = UploadProgressIndicatorDefault,
    uploadsEnabled: uploadsEnabledProp,
    UrlPreview = CardDefault,
    watcherCount,
    watchers,
  } = props;

  const {
    theme: {
      channel: { selectChannel },
      colors: { black },
    },
  } = useTheme();

  const [editing, setEditing] = useState<boolean | MessageType<At, Ch, Co, Ev, Me, Re, Us>>(false);
  const [error, setError] = useState<Error | boolean>(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastRead, setLastRead] =
    useState<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['lastRead']>();
  const [loading, setLoading] = useState(!channel?.state.messages.length);
  const [loadingMore, setLoadingMore] = useState(false);

  const [loadingMoreRecent, setLoadingMoreRecent] = useState(false);
  const [quotedMessage, setQuotedMessage] =
    useState<boolean | MessageType<At, Ch, Co, Ev, Me, Re, Us>>(false);
  const [thread, setThread] = useState<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread']>(
    threadProps || null,
  );
  const [threadHasMore, setThreadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);

  const [syncingChannel, setSyncingChannel] = useState(false);

  const { setTargetedMessage, targetedMessage } = useTargetedMessage(messageId);

  const toast = useToastContext();

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
        loadChannelAtMessage({ messageId });
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
      channel.sendEvent({ parent_id: thread?.id, type: 'typing.stop' } as StreamEvent<
        At,
        Ch,
        Co,
        Ev,
        Me,
        Re,
        Us
      >);
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
  const markRead: ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['markRead'] = useRef(
    throttle(
      () => {
        if (channel?.disconnected || !channel?.getConfig?.()?.read_events) {
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

  const handleEvent: EventHandler<At, Ch, Co, Ev, Me, Re, Us> = (event) => {
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
    /**
     * The more complex sync logic around internet connectivity (NetInfo) is part of Chat.tsx
     * listen to client.connection.recovered and all channel events
     */
    client.on('connection.recovered', connectionRecoveredHandler);
    client.on('connection.changed', connectionChangedHandler);
    channel?.on(handleEvent);

    return () => {
      client.off('connection.recovered', connectionRecoveredHandler);
      client.off('connection.changed', connectionChangedHandler);
      channel?.off(handleEvent);
    };
  }, [channelId, connectionChangedHandler, connectionRecoveredHandler, handleEvent]);

  const channelQueryCall = async (queryCall: () => void = () => null) => {
    setError(false);
    // Skips setting loading state when there are messages in the channel
    setLoading(!channel?.state.messages.length);

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
  };

  /**
   * Loads channel at first unread channel.
   */
  const loadChannelAtFirstUnreadMessage = () => {
    if (!channel) return;
    const unreadCount = channel.countUnread();
    if (unreadCount <= scrollToFirstUnreadThreshold) return;

    channel.state.clearMessages();
    channel.state.setIsUpToDate(false);

    return channelQueryCall(async () => {
      /**
       * Stream only keeps unread count of channel upto 255. So once the count of unread messages reaches 255, we stop counting.
       * Thus we need to handle these two cases separately.
       */
      if (unreadCount < globalUnreadCountLimit) {
        /**
         * We want to ensure that first unread message appears in the first window frame, when message list loads.
         * If we assume that we have a exact count of unread messages, then first unread message is at offset = channel.countUnread().
         * So we will query 2 messages after (and including) first unread message, and 30 messages before first unread
         * message. So 2nd message in list is the first unread message. We can safely assume that 2nd message in list
         * will be visible to user when list loads.
         */
        const offset = unreadCount - unreadMessagesOnInitialLoadLimit;
        await query(offset, 30);

        /**
         * If the number of messages are not enough to fill the screen (we are making an assumption here that on overage 4 messages
         * are enough to fill the screen), then we need to fetch some more messages on recent side.
         */
        if (
          channel.state.messages.length &&
          channel.state.messages.length <= scrollToFirstUnreadThreshold &&
          !channel.state.isUpToDate
        ) {
          const mostRecentMessage = channel.state.messages[channel.state.messages.length - 1];
          await queryAfterMessage(mostRecentMessage.id, 10 - channel.state.messages.length);
        }
      } else {
        /**
         * If the unread count is 255, then we don't have exact unread count anymore, to determine the offset for querying messages.
         * In this case we are going to query messages using date params instead of offset-limit e.g., created_at_before_or_equal
         * So we query 30 messages before the last time user read the channel - channel.lastRead()
         */
        await channel.query({
          messages: {
            created_at_before_or_equal: channel.lastRead() || new Date(0),
            limit: 30,
          },
        });

        /**
         * If the number of messages are not enough to fill the screen (we are making an assumption here that on overage 4 messages
         * are enough to fill the screen), then we need to fetch some more messages on recent side.
         */
        if (
          channel.state.messages.length <= unreadMessagesOnInitialLoadLimit &&
          !channel.state.isUpToDate
        ) {
          if (channel.state.messages.length > 0) {
            const mostRecentMessage = channel.state.messages[channel.state.messages.length - 1];
            await queryAfterMessage(mostRecentMessage.id, 5);
          } else {
            /**
             * If we didn't get any messages, which means first unread message is the first ever message in channel.
             * So simply fetch some messages after the lastRead datetime.
             * We are keeping the limit as 10 here, as opposed to 30 in cases above. The reason being, we want the list
             * to be scrolled upto first unread message. So in this case we will need the scroll to start at top of the list.
             * React native provides a prop `initialScrollIndex` on FlatList, but it doesn't really work well
             * especially for dynamic sized content. So when the list loads, we are just going to manually scroll
             * to top of the list - flRef.current.scrollToEnd(). This autoscroll behavior is not great in general, but its less
             * bad for scrolling up 10 messages than scrolling up 30 messages.
             */
            await channel.query({
              messages: {
                created_at_after: channel.lastRead() || new Date(0),
                limit: 10,
              },
            });
          }
        }
      }
    });
  };

  /**
   * Loads channel at specific message
   *
   * @param messageId If undefined, channel will be loaded at most recent message.
   * @param before Number of message to query before messageId
   * @param after Number of message to query after messageId
   */
  const loadChannelAtMessage: ChannelContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['loadChannelAtMessage'] = ({ after = 2, before = 30, messageId }) =>
    channelQueryCall(async () => {
      await queryAtMessage({ after, before, messageId });

      if (messageId) {
        setTargetedMessage(messageId);
      }
    });

  const loadChannel = () =>
    channelQueryCall(async () => {
      if (!channel?.initialized || !channel.state.isUpToDate) {
        await channel?.watch();
        channel?.state.setIsUpToDate(true);
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
        } as unknown as MessageResponse<At, Ch, Co, Me, Re, Us>);

      const failedMessages = messages
        .filter((message) => message.status === 'failed')
        .map(parseMessage);

      const failedThreadMessages = thread
        ? threadMessages.filter((message) => message.status === 'failed').map(parseMessage)
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
    channelQueryCall(async () => {
      await channel?.watch();
      channel?.state.setIsUpToDate(true);
    });

  /**
   * Makes a query to load messages in channel.
   */
  const query = async (offset = 0, limit = 30) => {
    if (!channel) return;
    channel.state.clearMessages();

    await channel.query({
      messages: {
        limit,
        offset,
      },
      watch: true,
    });
    channel.state.setIsUpToDate(offset === 0);
  };

  /**
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
  }: Parameters<ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>['loadChannelAtMessage']>[0]) => {
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

  /**
   * Channel configs for use in disabling local functionality.
   * Nullish coalescing is used to give first priority to props to override
   * the server settings. Then priority to server settings to override defaults.
   */
  const clientChannelConfig =
    typeof channel?.getConfig === 'function' ? channel.getConfig() : undefined;

  const messagesConfig: MessagesConfig = {
    /**
     * Replace with backend flag once its ready
     */
    mutesEnabled: mutesEnabledProp ?? clientChannelConfig?.mutes ?? true,
    pinMessageEnabled: pinMessageEnabledProp ?? true,
    quotedRepliesEnabled: quotedRepliesEnabledProp ?? true,
    reactionsEnabled: reactionsEnabledProp ?? clientChannelConfig?.reactions ?? true,
    threadRepliesEnabled: threadRepliesEnabledProp ?? clientChannelConfig?.replies ?? true,
  };
  const channelConfig: ChannelConfig = {
    readEventsEnabled: readEventsEnabledProp ?? clientChannelConfig?.read_events ?? true,
    typingEventsEnabled: typingEventsEnabledProp ?? clientChannelConfig?.typing_events ?? true,
  };
  const inputConfig: InputConfig = {
    maxMessageLength: maxMessageLengthProp ?? clientChannelConfig?.max_message_length ?? undefined,
    uploadsEnabled: uploadsEnabledProp ?? clientChannelConfig?.uploads ?? true,
  };

  /**
   * MESSAGE METHODS
   */

  const updateMessage: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['updateMessage'] = (
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
    oldMessage: MessageResponse<At, Ch, Co, Me, Re, Us>,
    newMessage: MessageResponse<At, Ch, Co, Me, Re, Us>,
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
  }: Partial<StreamMessage<At, Me, Us>>) => {
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
      status: 'sending',
      text,
      type: 'regular',
      user: {
        id: client.userID,
        ...client.user,
      },
      ...extraFields,
    } as unknown as MessageResponse<At, Ch, Co, Me, Re, Us>;

    /**
     * This is added to the message for local rendering prior to the message
     * being returned from the backend, it is removed when the message is sent
     * as quoted_message is a reserved field.
     */
    if (preview.quoted_message_id) {
      const quotedMessage = messages.find((message) => message.id === preview.quoted_message_id);

      preview.quoted_message = quotedMessage as MessageResponse<
        At,
        Ch,
        Co,
        Me,
        Re,
        Us
      >['quoted_message'];
    }
    return preview;
  };

  const sendMessageRequest = async (
    message: MessageResponse<At, Ch, Co, Me, Re, Us>,
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
    } as StreamMessage<At, Me, Us>;

    try {
      if (!StreamCache.getInstance().currentNetworkState) {
        console.log(t('Something went wrong'));
        toast.show(t('Something went wrong'), 2000);
        throw new Error('No network connection');
      }

      let messageResponse = {} as SendMessageAPIResponse<At, Ch, Co, Me, Re, Us>;

      if (doSendMessageRequest) {
        messageResponse = await doSendMessageRequest(channel?.cid || '', messageData);
      } else if (channel) {
        messageResponse = await channel.sendMessage(messageData);
      }

      if (messageResponse.message) {
        messageResponse.message.status = 'received';
        if (retrying) {
          replaceMessage(message, messageResponse.message);
        } else {
          updateMessage(messageResponse.message);
        }
      }
    } catch (err) {
      console.log(err);
      message.status = 'failed';
      updateMessage(message);
    }
  };

  const sendMessage: InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>['sendMessage'] =
    async (message) => {
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

  const retrySendMessage: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['retrySendMessage'] =
    async (message) => {
      const statusPendingMessage = {
        ...message,
        status: 'sending',
      };

      updateMessage(statusPendingMessage);
      await sendMessageRequest(statusPendingMessage, true);
    };

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreFinished = useRef(
    debounce(
      (
        updatedHasMore: boolean,
        newMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'],
      ) => {
        setLoadingMore(false);
        setError(false);
        setHasMore(updatedHasMore);
        setMessages(newMessages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  const loadMore: PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>['loadMore'] = async (
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

    if (oldestMessage && oldestMessage.status !== 'received') {
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
      console.warn('Message pagination request failed with error', err);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
      setLoadingMore(false);
      throw err;
    }
  };

  const loadMoreRecent: PaginatedMessageListContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['loadMoreRecent'] = async (limit = 5) => {
    if (channel?.state.isUpToDate) {
      return;
    }

    setLoadingMoreRecent(true);

    const recentMessage = messages[messages.length - 1];

    if (recentMessage?.status !== 'received') {
      setLoadingMoreRecent(false);
      return;
    }

    try {
      if (channel) {
        await queryAfterMessage(recentMessage.id, limit);
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
      (newMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages']) => {
        setLoadingMoreRecent(false);
        setMessages(newMessages);
        setError(false);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  const editMessage: InputMessageInputContextValue<At, Ch, Co, Ev, Me, Re, Us>['editMessage'] = (
    updatedMessage,
  ) =>
    doUpdateMessageRequest
      ? doUpdateMessageRequest(channel?.cid || '', updatedMessage)
      : client.updateMessage(updatedMessage);

  const setEditingState: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['setEditingState'] = (
    message,
  ) => {
    setEditing(message);
  };

  const setQuotedMessageState: MessagesContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['setQuotedMessageState'] = (message) => {
    setQuotedMessage(message);
  };

  const clearEditingState: InputMessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['clearEditingState'] = () => setEditing(false);

  const clearQuotedMessageState: InputMessageInputContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['clearQuotedMessageState'] = () => setQuotedMessage(false);

  const removeMessage: MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>['removeMessage'] = (
    message,
  ) => {
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
  const openThread: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['openThread'] = (message) => {
    const newThreadMessages = message?.id ? channel?.state?.threads[message.id] || [] : [];
    setThread(message);
    setThreadMessages(newThreadMessages);
  };

  const closeThread: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['closeThread'] =
    useCallback(() => {
      setThread(null);
      setThreadMessages([]);
    }, [setThread, setThreadMessages]);

  // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
  const loadMoreThreadFinished = useRef(
    debounce(
      (
        newThreadHasMore: boolean,
        updatedThreadMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['threads'][string],
      ) => {
        setThreadHasMore(newThreadHasMore);
        setThreadLoadingMore(false);
        setThreadMessages(updatedThreadMessages);
      },
      defaultDebounceInterval,
      debounceOptions,
    ),
  ).current;

  const loadMoreThread: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['loadMoreThread'] =
    async () => {
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

  const channelContext = useCreateChannelContext({
    ...channelConfig,
    channel,
    disabled: !!channel?.data?.frozen && disableIfFrozenChannel,
    EmptyStateIndicator,
    enableMessageGroupingByUser,
    enforceUniqueReaction,
    error,
    giphyEnabled:
      giphyEnabled ??
      !!(channel?.getConfig?.()?.commands || [])?.some((command) => command.name === 'giphy'),
    hideDateSeparators,
    hideStickyDateHeader,
    isAdmin,
    isChannelActive: shouldSyncChannel,
    isModerator,
    isOwner,
    lastRead,
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

  const inputMessageInputContext = useCreateInputMessageInputContext({
    ...inputConfig,
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
    setInputRef,
    setQuotedMessageState,
    ShowThreadMessageInChannelButton,
    UploadProgressIndicator,
  });

  const messageListContext = useCreatePaginatedMessageListContext({
    channelId,
    hasMore,
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
    ...messagesConfig,
    additionalTouchableProps,
    animatedLongPress,
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
    onDoubleTapMessage,
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
  });

  const suggestionsContext: Partial<SuggestionsContextValue<Co, Us>> = {
    closeSuggestions,
    openSuggestions,
    updateSuggestions,
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
      <ChannelProvider<At, Ch, Co, Ev, Me, Re, Us> value={channelContext}>
        <TypingProvider<At, Ch, Co, Ev, Me, Re, Us> value={typingContext}>
          <PaginatedMessageListProvider<At, Ch, Co, Ev, Me, Re, Us> value={messageListContext}>
            <MessagesProvider<At, Ch, Co, Ev, Me, Re, Us> value={messagesContext}>
              <ThreadProvider<At, Ch, Co, Ev, Me, Re, Us> value={threadContext}>
                <SuggestionsProvider<Co, Us> value={suggestionsContext}>
                  <MessageInputProvider<At, Ch, Co, Ev, Me, Re, Us>
                    value={inputMessageInputContext}
                  >
                    <View style={{ height: '100%' }}>{children}</View>
                  </MessageInputProvider>
                </SuggestionsProvider>
              </ThreadProvider>
            </MessagesProvider>
          </PaginatedMessageListProvider>
        </TypingProvider>
      </ChannelProvider>
    </KeyboardCompatibleView>
  );
};

export type ChannelProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<ChannelPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList, Thread, and MessageInput must be
 * children of the Channel component to receive the ChannelContext.
 *
 * @example ./Channel.md
 */
export const Channel = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: PropsWithChildren<ChannelProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
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
  } = useChannelState<At, Ch, Co, Ev, Me, Re, Us>(
    props.channel,
    props.threadList ? props.thread?.id : undefined,
  );

  return (
    <ChannelWithContext<At, Ch, Co, Ev, Me, Re, Us>
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
