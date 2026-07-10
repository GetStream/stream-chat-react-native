import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Channel as ChannelType,
  EventHandler,
  LocalMessage,
  MessageResponse,
  SendMessageAPIResponse,
  SendMessageOptions,
  StreamChat,
  Event as StreamEvent,
  Message as StreamMessage,
  Thread,
  UpdateMessageOptions,
} from 'stream-chat';

import { useChannelRequestHandlers } from './hooks/useChannelRequestHandlers';
import { useCreateChannelContext } from './hooks/useCreateChannelContext';

import { useCreateInputMessageInputContext } from './hooks/useCreateInputMessageInputContext';

import { useCreateMessagesContext } from './hooks/useCreateMessagesContext';

import { useCreateOwnCapabilitiesContext } from './hooks/useCreateOwnCapabilitiesContext';

import { useCreateThreadContext } from './hooks/useCreateThreadContext';

import {
  DEFAULT_HIGHLIGHT_DURATION,
  useMessageListPagination,
} from './hooks/useMessageListPagination';

import {
  AttachmentPickerContextValue,
  AttachmentPickerProvider,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  AudioPlayerContextProps,
  AudioPlayerProvider,
} from '../../contexts/audioPlayerContext/AudioPlayerContext';

import { ChannelContextValue, ChannelProvider } from '../../contexts/channelContext/ChannelContext';
import { useChannelState } from '../../contexts/channelsStateContext/useChannelState';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { MessageComposerProvider } from '../../contexts/messageComposerContext/MessageComposerContext';
import { MessageContextValue } from '../../contexts/messageContext/MessageContext';
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
import { useStableCallback } from '../../hooks';
import { useAppStateListener } from '../../hooks/useAppStateListener';

import { useAttachmentPickerBottomSheet } from '../../hooks/useAttachmentPickerBottomSheet';
import { useStateStore } from '../../hooks/useStateStore';
import {
  isDocumentPickerAvailable,
  isImageMediaLibraryAvailable,
  isImagePickerAvailable,
  NativeHandlers,
} from '../../native';
import { MessageInputHeightStore } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import type { ChannelUnreadState } from '../../types/types';
import { patchMessageTextCommand } from '../../utils/patchMessageTextCommand';
import { MessageStatusTypes, ReactionData } from '../../utils/utils';
import { NotificationAnnouncer } from '../Accessibility/NotificationAnnouncer';
import { AttachmentPicker } from '../AttachmentPicker/AttachmentPicker';
import type { KeyboardCompatibleViewProps } from '../KeyboardCompatibleView/KeyboardCompatibleView';
import { useMarkRead } from '../MessageList/hooks/useMarkRead';
import { Emoji } from '../MessageMenu/EmojiPickerList';
import { emojis } from '../MessageMenu/emojis';
import { toUnicodeScalarString } from '../MessageMenu/utils/toUnicodeScalarString';
import { getChannelNotificationHostId } from '../Notifications/notificationTarget';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export type MarkReadFunctionOptions = {
  /**
   * Signal, whether the `channelUnreadUiState` should be updated.
   * By default, the local state update is prevented when the Channel component is mounted.
   * This is in order to keep the UI indicating the original unread state, when the user opens a channel.
   */
  updateChannelUnreadState?: boolean;
};

export const reactionData: ReactionData[] = [
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'👍'} size={size} />,
    type: 'like',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'😂'} size={size} />,
    type: 'haha',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'❤️'} size={size} />,
    type: 'love',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'😮'} size={size} />,
    type: 'wow',
    isMain: true,
  },
  {
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={'😢'} size={size} />,
    type: 'sad',
    isMain: true,
  },
  ...emojis.map((emoji) => ({
    Icon: ({ size = 12 }: { size?: number }) => <Emoji item={emoji} size={size} />,
    type: toUnicodeScalarString(emoji),
  })),
];

/**
 * If count of unread messages is less than 4, then no need to scroll to first unread message,
 * since first unread message will be in visible frame anyways.
 */
const scrollToFirstUnreadThreshold = 0;

export type ChannelPropsWithContext = Pick<ChannelContextValue, 'channel'> &
  Partial<
    Pick<
      AttachmentPickerContextValue,
      | 'bottomInset'
      | 'topInset'
      | 'disableAttachmentPicker'
      | 'numberOfAttachmentPickerImageColumns'
      | 'numberOfAttachmentImagesToLoadPerCall'
    >
  > &
  Partial<
    Pick<
      ChannelContextValue,
      | 'enableMessageGroupingByUser'
      | 'enforceUniqueReaction'
      | 'hideStickyDateHeader'
      | 'hideDateSeparators'
      | 'maxTimeBetweenGroupedMessages'
      | 'maximumMessageLimit'
    >
  > &
  Pick<ChatContextValue, 'client' | 'enableOfflineSupport' | 'isOnline'> &
  Partial<
    Pick<
      InputMessageInputContextValue,
      | 'additionalTextInputProps'
      | 'allowSendBeforeAttachmentsUpload'
      | 'asyncMessagesLockDistance'
      | 'asyncMessagesMinimumPressDuration'
      | 'audioRecordingSendOnComplete'
      | 'asyncMessagesSlideToCancelDistance'
      | 'attachmentPickerBottomSheetHeight'
      | 'attachmentSelectionBarHeight'
      | 'audioRecordingEnabled'
      | 'compressImageQuality'
      | 'createPollOptionGap'
      | 'doFileUploadRequest'
      | 'focusInputOnPickerClose'
      | 'handleAttachButtonPress'
      | 'hasCameraPicker'
      | 'hasCommands'
      | 'hasFilePicker'
      | 'hasImagePicker'
      | 'messageInputFloating'
      | 'openPollCreationDialog'
      | 'setInputRef'
    >
  > &
  Pick<TranslationContextValue, 't'> &
  Partial<
    Pick<
      MessagesContextValue,
      | 'additionalPressableProps'
      | 'customMessageSwipeAction'
      | 'disableTypingIndicator'
      | 'dismissKeyboardOnMessageTouch'
      | 'enableSwipeToReply'
      | 'urlPreviewType'
      | 'FlatList'
      | 'forceAlignMessages'
      | 'getMessageGroupStyle'
      | 'giphyVersion'
      | 'handleBan'
      | 'handleCopy'
      | 'handleDelete'
      | 'handleDeleteForMe'
      | 'handleEdit'
      | 'handleFlag'
      | 'handleMarkUnread'
      | 'handleMute'
      | 'handlePinMessage'
      | 'handleReaction'
      | 'handleQuotedReply'
      | 'handleRetry'
      | 'handleThreadReply'
      | 'handleBlockUser'
      | 'isAttachmentEqual'
      | 'markdownRules'
      | 'messageActions'
      | 'messageContentOrder'
      | 'messageOverlayTargetId'
      | 'messageTextNumberOfLines'
      | 'messageSwipeToReplyHitSlop'
      | 'myMessageTheme'
      | 'onLongPressMessage'
      | 'onPressInMessage'
      | 'onPressMessage'
      | 'reactionListPosition'
      | 'reactionListType'
      | 'shouldShowUnreadUnderlay'
      | 'selectReaction'
      | 'supportedReactions'
      | 'hasCreatePoll'
    >
  > &
  Partial<Pick<MessageContextValue, 'isMessageAIGenerated'>> &
  Partial<
    Pick<ThreadContextValue, 'allowThreadMessagesInChannel' | 'onAlsoSentToChannelHeaderPress'>
  > & {
    shouldSyncChannel: boolean;
    thread: ThreadType;
    /**
     * Additional props passed to keyboard avoiding view
     */
    additionalKeyboardAvoidingViewProps?: Partial<KeyboardCompatibleViewProps>;
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
      channel: ChannelType,
      setChannelUnreadUiState?: (data: ChannelUnreadState | undefined) => void,
    ) => void;
    /**
     * Overrides the Stream default send message request (Advanced usage only)
     * @param channelId
     * @param messageData Message object
     */
    doSendMessageRequest?: (
      channelId: string,
      messageData: StreamMessage,
      options?: SendMessageOptions,
    ) => Promise<SendMessageAPIResponse>;

    /**
     * A method invoked just after the first optimistic update of a new message,
     * but before any other HTTP requests happen. Can be used to do extra work
     * (such as creating a channel, or editing a message) before the local message
     * is sent.
     * @param channelId
     * @param messageData Message object
     */
    preSendMessageRequest?: (options: {
      localMessage: LocalMessage;
      message: StreamMessage;
      options?: SendMessageOptions;
    }) => Promise<void>;
    /**
     * Overrides the Stream default update message request (Advanced usage only)
     * @param channelId
     * @param updatedMessage UpdatedMessage object
     */
    doUpdateMessageRequest?: (
      channelId: string,
      updatedMessage: Parameters<StreamChat['updateMessage']>[0],
      options?: UpdateMessageOptions,
    ) => ReturnType<StreamChat['updateMessage']>;
    /**
     * When true, messageList will be scrolled at first unread message, when opened.
     */
    initialScrollToFirstUnreadMessage?: boolean;
    keyboardBehavior?: KeyboardCompatibleViewProps['behavior'];
    keyboardVerticalOffset?: number;
    /**
     * Boolean flag to enable/disable marking the channel as read on mount
     */
    markReadOnMount?: boolean;
    /**
     * Load the channel at a specified message instead of the most recent message.
     */
    messageId?: string;
    notificationHostId?: string;
    /**
     * @deprecated
     * The time interval for throttling while updating the message state
     */
    newMessageStateUpdateThrottleInterval?: number;
    overrideOwnCapabilities?: Partial<OwnCapabilitiesContextValue>;
    /**
     * If true, multiple audio players will be allowed to play simultaneously
     * @default true
     */
    allowConcurrentAudioPlayback?: boolean;
    stateUpdateThrottleInterval?: number;
    /**
     * Tells if channel is rendering a thread list
     */
    threadList?: boolean;
    /**
     * A boolean signifying whether the Channel component should run channel.watch()
     * whenever it mounts up a new channel. If set to `false`, it is the integrator's
     * responsibility to run channel.watch() if they wish to receive WebSocket events
     * for that channel.
     *
     * Can be particularly useful whenever we are viewing channels in a read-only mode
     * or perhaps want them in an ephemeral state (i.e not created until the first message
     * is sent).
     */
    initializeOnMount?: boolean;
  };

// The highlighted message id is derived from the paginator's messageFocusSignal (LLC), which is
// emitted by the jump fns and auto-cleared after its TTL — no separate targeted-message React state.
const messageFocusSignalSelector = (state: { signal: { messageId?: string } | null }) => ({
  highlightedMessageId: state.signal?.messageId,
});

const ChannelWithContext = (props: PropsWithChildren<ChannelPropsWithContext>) => {
  const {
    disableAttachmentPicker = !isImageMediaLibraryAvailable(),
    additionalKeyboardAvoidingViewProps,
    additionalPressableProps,
    additionalTextInputProps,
    allowConcurrentAudioPlayback = false,
    allowThreadMessagesInChannel = true,
    asyncMessagesLockDistance = 50,
    asyncMessagesMinimumPressDuration = 500,
    asyncMessagesSlideToCancelDistance = 75,
    audioRecordingSendOnComplete = false,
    attachmentPickerBottomSheetHeight = disableAttachmentPicker ? 72 : 333,
    attachmentSelectionBarHeight = 72,
    audioRecordingEnabled = false,
    numberOfAttachmentImagesToLoadPerCall = 25,
    numberOfAttachmentPickerImageColumns = 3,
    giphyVersion = 'fixed_height',
    bottomInset = 0,
    channel,
    children,
    client,
    compressImageQuality,
    createPollOptionGap,
    customMessageSwipeAction,
    disableKeyboardCompatibleView = false,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch = true,
    doFileUploadRequest,
    doMarkReadRequest,
    doSendMessageRequest,
    preSendMessageRequest,
    doUpdateMessageRequest,
    enableMessageGroupingByUser = true,
    enableOfflineSupport,
    allowSendBeforeAttachmentsUpload = enableOfflineSupport,
    enableSwipeToReply = true,
    enforceUniqueReaction = false,
    FlatList = NativeHandlers.FlatList,
    focusInputOnPickerClose = true,
    forceAlignMessages,
    getMessageGroupStyle,
    handleAttachButtonPress,
    handleBan,
    handleCopy,
    handleDelete,
    handleDeleteForMe,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    handleBlockUser,
    hasCameraPicker = isImagePickerAvailable(),
    hasCommands,
    hasCreatePoll,
    // If pickDocument isn't available, default to hiding the file picker
    hasFilePicker = isDocumentPickerAvailable(),
    hasImagePicker = isImagePickerAvailable() || isImageMediaLibraryAvailable(),
    hideDateSeparators = false,
    hideStickyDateHeader = false,
    initialScrollToFirstUnreadMessage = false,
    isAttachmentEqual,
    isMessageAIGenerated = () => false,
    keyboardBehavior,
    keyboardVerticalOffset,
    markdownRules,
    markReadOnMount = true,
    maxTimeBetweenGroupedMessages,
    messageActions,
    messageContentOrder = [
      'quoted_reply',
      'gallery',
      'files',
      'poll',
      'ai_text',
      'attachments',
      'text',
      'location',
    ],
    messageOverlayTargetId,
    messageInputFloating = false,
    messageId,
    messageSwipeToReplyHitSlop,
    messageTextNumberOfLines,
    myMessageTheme,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    onAlsoSentToChannelHeaderPress,
    openPollCreationDialog,
    overrideOwnCapabilities,
    reactionListPosition = 'top',
    reactionListType = 'clustered',
    selectReaction,
    setInputRef,
    shouldShowUnreadUnderlay = true,
    shouldSyncChannel,
    supportedReactions = reactionData,
    t,
    thread: threadFromProps,
    threadList,
    topInset = 0,
    maximumMessageLimit,
    initializeOnMount = true,
    urlPreviewType = 'full',
  } = props;

  const components = useComponentsContext();
  const { KeyboardCompatibleView, LoadingErrorIndicator } = components;

  const { thread: threadProps, threadInstance: threadInstanceFromProps } = threadFromProps;

  const styles = useStyles();
  const [deleted, setDeleted] = useState<boolean>(false);
  const [error, setError] = useState<Error | boolean>(false);
  const lastReadRef = useRef<Date | undefined>(undefined);
  const [thread, setThread] = useState<LocalMessage | null>(threadProps || null);
  const [threadInstance, setThreadInstance] = useState<Thread | null>(
    threadInstanceFromProps ?? null,
  );
  const [threadHasMore] = useState(true);
  const [threadLoadingMore, setThreadLoadingMore] = useState(false);
  const [messageInputHeightStore] = useState(() => new MessageInputHeightStore());
  const { bottomSheetRef, closePicker, openPicker } = useAttachmentPickerBottomSheet();

  const syncingChannelRef = useRef(false);

  const { highlightedMessageId } = useStateStore(
    (threadInstance ?? channel).messagePaginator.messageFocusSignal,
    messageFocusSignalSelector,
  );

  /**
   * This ref will hold the abort controllers for
   * requests made for uploading images/files in the messageInputContext
   * Its a map of filename to AbortController
   */
  const uploadAbortControllerRef = useRef<Map<string, AbortController>>(new Map());
  /**
   * This ref keeps track of message IDs which have already been optimistically updated.
   * We need it to make sure we don't react on message.new/notification.message_new events
   * if this is indeed the case, as it's a full list update for nothing.
   */
  const optimisticallyUpdatedNewMessages = useMemo<Set<string>>(() => new Set(), []);

  const channelId = channel?.id || '';
  const pollCreationEnabled = !channel.disconnected && !!channel?.id && channel?.getConfig()?.polls;

  // Register the integrator's custom message-request overrides into channel.configState so the
  // stream-chat message-operations engine (send/retry/update via *WithLocalUpdate) honors them.
  useChannelRequestHandlers({
    channel,
    doMarkReadRequest,
    doSendMessageRequest,
    doUpdateMessageRequest,
  });

  const {
    loadChannelAroundMessage: loadChannelAroundMessageFn,
    loadChannelAtFirstUnreadMessage,
    loadLatestMessages,
    state: channelMessagesState,
  } = useMessageListPagination({
    channel,
  });

  const shouldLoadInitialChannelAtFirstUnreadMessage = useStableCallback((unreadCount?: number) => {
    if (messageId || !initialScrollToFirstUnreadMessage || !client.user) {
      return false;
    }

    return (unreadCount ?? channel.countUnread()) > scrollToFirstUnreadThreshold;
  });

  const hasPendingInitialTargetLoad = useStableCallback(() => {
    return !!messageId || shouldLoadInitialChannelAtFirstUnreadMessage();
  });

  const handleEvent: EventHandler = useStableCallback((event) => {
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

      // Typing state is sourced reactively from channel.state.typingStore; nothing to copy here.
      if (event.type === 'typing.start' || event.type === 'typing.stop') {
        return;
      }

      // notification.mark_unread + channel.truncated update channel.messagePaginator.unreadStateSnapshot
      // in the LLC (the single source of truth for unread state), so no manual handling here.

      // The message list is backed reactively by channel.messagePaginator (channel._handleChannelEvent
      // ingests message.new/updated/deleted + reaction events), and read/typing/members come from
      // their reactive stores — so the WS handler no longer copies channel.state into React state.
      if (event.type === 'message.new' || event.type === 'notification.message_new') {
        optimisticallyUpdatedNewMessages.delete(event.message?.id ?? '');
      }
    }
  });

  useEffect(() => {
    let listener: ReturnType<typeof channel.on>;
    const initChannel = async () => {
      lastReadRef.current = new Date();
      const unreadCount = channel.countUnread();
      const shouldLoadAtFirstUnread = shouldLoadInitialChannelAtFirstUnreadMessage(unreadCount);
      if (!channel || !shouldSyncChannel) {
        return;
      }
      let errored = false;

      if ((!channel.initialized || !channel.state.isUpToDate) && initializeOnMount) {
        try {
          await channel?.watch();
        } catch (err) {
          console.warn('Channel watch request failed with error:', err);
          setError(true);
          errored = true;
          channel.offlineMode = true;
        }
      }

      if (!errored) {
        // Seed the paginator for a cold open (deep link / push). Channels reached via the channel
        // list are already seeded by client.hydrateActiveChannels, so guard on an empty paginator
        // to avoid a redundant fetch.
        if (!channel.messagePaginator.state.getLatestValue().items?.length) {
          await channel.messagePaginator.reload();
        }
      }

      // The paginator's unreadStateSnapshot is populated by the seed/reload above (the single source
      // of truth for unread state), so there's no manual initial read-state copy here.

      if (messageId) {
        await loadChannelAroundMessage({ messageId });
      } else if (shouldLoadAtFirstUnread) {
        // jumpToTheFirstUnreadMessage resolves the first-unread id from the paginator's snapshot.
        await loadChannelAtFirstUnreadMessage();
      }

      if (unreadCount > 0 && markReadOnMount) {
        await markRead();
      }

      listener = channel.on(handleEvent);
    };

    initChannel();

    return () => {
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

  const threadPropsExists = !!threadProps;

  useEffect(() => {
    if (threadProps && shouldSyncChannel) {
      setThread(threadProps);
      // A thread supplied via props without its own Thread instance still needs one so the reply
      // list is backed by thread.messagePaginator (mirrors openThread).
      if (channel && threadProps?.id && !threadInstanceFromProps) {
        const newThreadInstance = new Thread({ channel, client, parentMessage: threadProps });
        setThreadInstance(newThreadInstance);
        newThreadInstance.messagePaginator
          .reload()
          .catch((err) => console.warn('Thread reply load failed with error:', err));
      }
    } else {
      setThread(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadPropsExists, shouldSyncChannel]);

  const handleAppBackground = useCallback(() => {
    const channelData = channel.data;
    if (channelData?.own_capabilities?.includes('send-typing-events')) {
      channel.sendEvent({
        parent_id: thread?.id,
        type: 'typing.stop',
      } as StreamEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, channelId]);

  useAppStateListener(undefined, handleAppBackground);

  /**
   * CHANNEL METHODS
   */
  // markRead is no longer placed on the ChannelContext; the message lists own their own throttled
  // instance via useMarkRead(channel). Channel still needs it internally (mark-read-on-mount + resync).
  const markRead = useMarkRead(channel);

  const reloadThread = useStableCallback(async () => {
    if (!channel || !thread?.id || !threadInstance) {
      return;
    }
    setThreadLoadingMore(true);
    try {
      // Rehydrate the thread instance (parent + read state) and reload its reply paginator.
      await threadInstance.reload();
      await threadInstance.messagePaginator.reload();
      setThreadLoadingMore(false);
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
  });

  const resyncChannel = useStableCallback(async () => {
    if (!channel || syncingChannelRef.current || (!channel.initialized && !channel.offlineMode)) {
      return;
    }
    syncingChannelRef.current = true;
    setError(false);

    const parseMessage = (message: LocalMessage) =>
      ({
        ...message,
        created_at: message.created_at.toString(),
        pinned_at: message.pinned_at?.toString(),
        updated_at: message.updated_at?.toString(),
      }) as unknown as MessageResponse;

    const getRecoverableFailedMessages = (messages: LocalMessage[] = []) =>
      messages
        .filter(
          (message) =>
            message.status === MessageStatusTypes.FAILED &&
            !channel.state.findMessage(message.id, message.parent_id),
        )
        .map(parseMessage);

    try {
      if (channelMessagesState?.messages) {
        await channel?.watch({
          messages: {
            // Do we want to reduce this to the default as well ?
            limit: channelMessagesState.messages.length,
          },
        });
        channel.offlineMode = false;
      }

      if (!thread) {
        const failedMessages = getRecoverableFailedMessages(channelMessagesState.messages);
        await channel.messagePaginator.reload();
        if (failedMessages?.length) {
          channel.state.addMessagesSorted(failedMessages);
          failedMessages.forEach((m) =>
            channel.messagePaginator.ingestItem(channel.state.formatMessage(m)),
          );
        }
        await markRead();
        channel.state.setIsUpToDate(true);
      } else {
        await reloadThread();

        const currentThreadMessages =
          threadInstance?.messagePaginator?.state.getLatestValue().items ?? [];
        const failedThreadMessages = getRecoverableFailedMessages(currentThreadMessages);
        if (failedThreadMessages.length) {
          channel.state.addMessagesSorted(failedThreadMessages);
          failedThreadMessages.forEach((m) =>
            threadInstance?.messagePaginator?.ingestItem(channel.state.formatMessage(m)),
          );
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
  });

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

    if (enableOfflineSupport && client.offlineDb) {
      connectionChangedSubscription = client.offlineDb.syncManager.onSyncStatusChange(
        (statusChanged) => {
          if (statusChanged) {
            connectionChangedHandler();
          }
        },
      );
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
  }, [enableOfflineSupport, client, shouldSyncChannel]);

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

  const reloadChannel = useStableCallback(async () => {
    try {
      await loadLatestMessages();
    } catch (err) {
      console.warn('Reloading channel failed with error:', err);
    }
  });

  const loadChannelAroundMessage: ChannelContextValue['loadChannelAroundMessage'] =
    useStableCallback(async ({ messageId: messageIdToLoadAround }): Promise<void> => {
      if (!messageIdToLoadAround) {
        return;
      }
      try {
        if (thread) {
          setThreadLoadingMore(true);
          try {
            // jumpToMessage loads the message range into thread.messagePaginator (which backs the
            // reply list) and emits the focus signal driving the thread-aware highlight + scroll.
            await threadInstance?.messagePaginator?.jumpToMessage(messageIdToLoadAround, {
              focusReason: 'jump-to-message',
              focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
            });
            setThreadLoadingMore(false);
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
          });
        }
      } catch (err) {
        console.warn('Loading channel around message failed with error:', err);
      }
    });

  /**
   * MESSAGE METHODS
   */
  const sendMessage: InputMessageInputContextValue['sendMessage'] = useStableCallback(
    async ({ localMessage, message, options }) => {
      if (preSendMessageRequest) {
        await preSendMessageRequest({ localMessage, message, options });
      }

      // Preserve RN's moderation slash-command patching ("/mute @user" -> "/mute @userId").
      const messageToSend = message
        ? {
            ...message,
            text: patchMessageTextCommand(message.text ?? '', message.mentioned_users ?? []),
          }
        : message;

      // The stream-chat message-operations engine owns the full optimistic lifecycle (pending ->
      // received/failed), offline-DB persistence and paginator ingest — for both channel messages
      // (channel.messagePaginator) and thread replies (thread.messagePaginator, which the thread
      // instance ingests into directly). It throws on failure, which the MessageInput send flow
      // catches to surface a notification.
      await (threadInstance ?? channel).sendMessageWithLocalUpdate({
        localMessage,
        message: messageToSend,
        options,
      });
    },
  );

  const editMessage: InputMessageInputContextValue['editMessage'] = useStableCallback(
    async ({ localMessage, options }) => {
      if (!channel) {
        throw new Error('Channel has not been initialized');
      }
      // The LLC handles the optimistic local update (ingest into the paginator), the network
      // request (honoring any doUpdateMessageRequest registered into channel.configState in
      // useChannelRequestHandlers), the received/failed state transitions, and offline queueing.
      // Thread edits route through the thread instance's own message operations.
      await (threadInstance ?? channel).updateMessageWithLocalUpdate({ localMessage, options });
    },
  );

  /**
   * THREAD METHODS
   */
  const openThread: ThreadContextValue['openThread'] = useCallback(
    (message) => {
      // Construct a stream-chat Thread instance for the opened parent message; its
      // messagePaginator drives the reply list + optimistic reply ops.
      const newThreadInstance = new Thread({ channel, client, parentMessage: message });
      setThread(message);
      setThreadInstance(newThreadInstance);
      // Seed the reply paginator so replies render on open.
      newThreadInstance.messagePaginator
        .reload()
        .catch((err) => console.warn('Thread reply load failed with error:', err));
      if (channel.initialized) {
        // Mark the thread read on open. A freshly-constructed minimal thread has ownUnreadCount 0,
        // so threadInstance.markRead() would no-op; channel.markRead({thread_id}) marks it reliably
        // (and still delegates to the messageDeliveryReporter). Opening a reply-less parent has no
        // server-side thread yet, so this rejects with "thread not found" — a benign no-op we swallow
        // (otherwise it surfaces as an unhandled promise rejection / dev redbox).
        channel
          .markRead({ thread_id: message.id })
          .catch((err) => console.warn('Marking thread as read on open failed with error:', err));
      }
    },
    [channel, client],
  );

  const closeThread: ThreadContextValue['closeThread'] = useCallback(() => {
    setThread(null);
    setThreadInstance(null);
  }, []);

  const loadMoreThread: ThreadContextValue['loadMoreThread'] = useStableCallback(async () => {
    // Older replies are paginated via the thread's messagePaginator, which backs the reply list.
    // (useCreateThreadContext also wires loadMoreThread to the paginator when a thread instance
    // exists — this keeps the ThreadContext shape stable and the behavior identical; the paginator
    // guards against concurrent loads and tracks hasMore/loading reactively.)
    if (!threadInstance) {
      return;
    }
    try {
      await threadInstance.messagePaginator.toTail();
    } catch (err) {
      console.warn('Message pagination request failed with error', err);
      if (err instanceof Error) {
        setError(err);
      } else {
        setError(true);
      }
      throw err;
    }
  });

  const handleClosePicker = useStableCallback(() => closePicker(bottomSheetRef));
  const handleOpenPicker = useStableCallback(() => openPicker(bottomSheetRef));

  const attachmentPickerContext = useMemo(
    () => ({
      bottomInset,
      bottomSheetRef,
      closePicker: handleClosePicker,
      disableAttachmentPicker,
      openPicker: handleOpenPicker,
      topInset,
      numberOfAttachmentPickerImageColumns,
      attachmentPickerBottomSheetHeight,
      attachmentSelectionBarHeight,
      numberOfAttachmentImagesToLoadPerCall,
    }),
    [
      bottomInset,
      bottomSheetRef,
      handleClosePicker,
      disableAttachmentPicker,
      handleOpenPicker,
      topInset,
      numberOfAttachmentPickerImageColumns,
      attachmentPickerBottomSheetHeight,
      attachmentSelectionBarHeight,
      numberOfAttachmentImagesToLoadPerCall,
    ],
  );

  const ownCapabilitiesContext = useCreateOwnCapabilitiesContext({
    channel,
    overrideCapabilities: overrideOwnCapabilities,
  });

  const channelContext = useCreateChannelContext({
    channel,
    disabled: !!channel?.data?.frozen,
    enableMessageGroupingByUser,
    enforceUniqueReaction,
    error,
    hideDateSeparators,
    hideStickyDateHeader,
    highlightedMessageId,
    isChannelActive: shouldSyncChannel,
    loadChannelAroundMessage,
    loadChannelAtFirstUnreadMessage,
    loading: channelMessagesState.loading,
    maximumMessageLimit,
    maxTimeBetweenGroupedMessages,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    hasPendingInitialTargetLoad,
    threadList,
    uploadAbortControllerRef,
  });

  // This is mainly a hack to get around an issue with sendMessage not being passed correctly as a
  // useMemo() dependency. The easy fix is to add it to the dependency array, however that would mean
  // that this (very used) context is essentially going to cause rerenders on pretty much every Channel
  // render, since sendMessage is an inline function. Wrapping it in useCallback() is one way to fix it
  // but it is definitely not trivial, especially considering it depends on other inline functions that
  // are not wrapped in a useCallback() themselves hence creating a huge cascading change. Can be removed
  // once our memoization issues are fixed in most places in the app or we move to a reactive state store.
  // const sendMessageRef = useRef<InputMessageInputContextValue['sendMessage']>(sendMessage);
  // sendMessageRef.current = sendMessage;
  // const sendMessageStable = useCallback<InputMessageInputContextValue['sendMessage']>((...args) => {
  //   return sendMessageRef.current(...args);
  // }, []);

  const inputMessageInputContext = useCreateInputMessageInputContext({
    additionalTextInputProps,
    allowSendBeforeAttachmentsUpload,
    asyncMessagesLockDistance,
    asyncMessagesMinimumPressDuration,
    audioRecordingSendOnComplete,
    asyncMessagesSlideToCancelDistance,
    attachmentPickerBottomSheetHeight,
    attachmentSelectionBarHeight,
    audioRecordingEnabled,
    channelId,
    compressImageQuality,
    createPollOptionGap,
    doFileUploadRequest,
    editMessage,
    focusInputOnPickerClose,
    handleAttachButtonPress,
    hasCameraPicker,
    hasCommands: hasCommands ?? !!clientChannelConfig?.commands?.length,
    hasFilePicker,
    hasImagePicker,
    messageInputFloating,
    messageInputHeightStore,
    openPollCreationDialog,
    sendMessage,
    setInputRef,
  });

  const messagesContext = useCreateMessagesContext({
    additionalPressableProps,
    channelId,
    customMessageSwipeAction,
    disableTypingIndicator,
    dismissKeyboardOnMessageTouch,
    enableMessageGroupingByUser,
    enableSwipeToReply,
    FlatList,
    forceAlignMessages,
    getMessageGroupStyle,
    giphyVersion,
    handleBan,
    handleCopy,
    handleDelete,
    handleDeleteForMe,
    handleEdit,
    handleFlag,
    handleMarkUnread,
    handleMute,
    handlePinMessage,
    handleQuotedReply,
    handleReaction,
    handleRetry,
    handleThreadReply,
    handleBlockUser,
    hasCreatePoll:
      hasCreatePoll === undefined ? pollCreationEnabled : hasCreatePoll && pollCreationEnabled,
    initialScrollToFirstUnreadMessage: !messageId && initialScrollToFirstUnreadMessage, // when messageId is set, we scroll to the messageId instead of first unread
    isAttachmentEqual,
    isMessageAIGenerated,
    markdownRules,
    messageActions,
    messageContentOrder,
    messageOverlayTargetId,
    messageSwipeToReplyHitSlop,
    messageTextNumberOfLines,
    myMessageTheme,
    onLongPressMessage,
    onPressInMessage,
    onPressMessage,
    reactionListPosition,
    reactionListType,
    selectReaction,
    shouldShowUnreadUnderlay,
    supportedReactions,
    urlPreviewType,
  });

  const threadContext = useCreateThreadContext({
    allowThreadMessagesInChannel,
    onAlsoSentToChannelHeaderPress,
    closeThread,
    loadMoreThread,
    openThread,
    reloadThread,
    setThreadLoadingMore,
    thread,
    threadHasMore,
    threadInstance,
    threadLoadingMore,
  });

  const audioPlayerContext = useMemo<AudioPlayerContextProps>(
    () => ({ allowConcurrentAudioPlayback }),
    [allowConcurrentAudioPlayback],
  );

  const messageComposerContext = useMemo(
    () => ({ channel, thread, threadInstance }),
    [channel, thread, threadInstance],
  );

  // TODO: replace the null view with appropriate message. Currently this is waiting a design decision.
  if (deleted) {
    return null;
  }

  if (!channel || (error && channelMessagesState.messages?.length === 0)) {
    return <LoadingErrorIndicator error={error} listType='message' retry={reloadChannel} />;
  }

  if (!channel?.cid || !channel.watch) {
    return (
      <Text style={styles.selectChannel} testID='no-channel'>
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
      <ChannelProvider value={channelContext}>
        <OwnCapabilitiesProvider value={ownCapabilitiesContext}>
          <MessagesProvider value={messagesContext}>
            <ThreadProvider value={threadContext}>
              <AttachmentPickerProvider value={attachmentPickerContext}>
                <MessageComposerProvider value={messageComposerContext}>
                  <MessageInputProvider value={inputMessageInputContext}>
                    <AudioPlayerProvider value={audioPlayerContext}>
                      <NotificationAnnouncer />
                      <View style={{ height: '100%' }}>{children}</View>
                      <AttachmentPicker />
                    </AudioPlayerProvider>
                  </MessageInputProvider>
                </MessageComposerProvider>
              </AttachmentPickerProvider>
            </ThreadProvider>
          </MessagesProvider>
        </OwnCapabilitiesProvider>
      </ChannelProvider>
    </KeyboardCompatibleView>
  );
};

export type ChannelProps = Partial<Omit<ChannelPropsWithContext, 'channel' | 'thread'>> &
  Pick<ChannelPropsWithContext, 'channel'> & {
    thread?: LocalMessage | ThreadType | null;
  };

/**
 *
 * The wrapper component for a chat channel. Channel needs to be placed inside a Chat component
 * to receive the StreamChat client instance. MessageList, Thread, and MessageComposer must be
 * children of the Channel component to receive the ChannelContext.
 *
 * @example ./Channel.md
 */
export const Channel = (props: PropsWithChildren<ChannelProps>) => {
  const { client, enableOfflineSupport, isOnline, isMessageAIGenerated } = useChatContext();
  const { t } = useTranslationContext();
  const notificationHostId =
    props.notificationHostId ??
    (props.channel?.cid ? getChannelNotificationHostId(props.channel.cid) : undefined);

  const threadFromProps = props?.thread;
  const threadInstance = (threadFromProps as ThreadType)?.threadInstance as Thread;
  const threadMessage = (
    threadInstance ? (threadFromProps as ThreadType).thread : threadFromProps
  ) as LocalMessage;

  const thread: ThreadType = {
    thread: threadMessage,
    threadInstance,
  };

  const shouldSyncChannel = threadMessage?.id ? !!props.threadList : true;

  useChannelState(props.channel);

  const channelWithContext = (
    <ChannelWithContext
      {...{
        client,
        enableOfflineSupport,
        t,
      }}
      {...props}
      shouldSyncChannel={shouldSyncChannel}
      {...{
        isMessageAIGenerated,
        isOnline,
        thread,
      }}
    />
  );

  return notificationHostId ? (
    <NotificationTargetProvider hostId={notificationHostId} panel='channel'>
      {channelWithContext}
    </NotificationTargetProvider>
  ) : (
    channelWithContext
  );
};

const useStyles = () => {
  const {
    theme: {
      channel: { selectChannel },
      semantics,
    },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      selectChannel: {
        fontWeight: primitives.typographyFontWeightSemiBold,
        fontSize: primitives.typographyFontSizeMd,
        lineHeight: primitives.typographyLineHeightNormal,
        padding: primitives.spacingMd,
        color: semantics.textPrimary,
        ...selectChannel,
      },
    });
  }, [selectChannel, semantics]);
};
