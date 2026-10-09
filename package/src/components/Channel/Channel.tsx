import React, { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ChannelConfig,
  ChannelDataState,
  ChannelLifecycleState,
  LocalMessage,
  MessageComposerConfig,
  Event as StreamEvent,
  Thread,
} from 'stream-chat';

import { useCreateChannelContext } from './hooks/useCreateChannelContext';

import { useCreateInputMessageInputContext } from './hooks/useCreateInputMessageInputContext';

import { useCreateMessagesContext } from './hooks/useCreateMessagesContext';

import { useCreateOwnCapabilitiesContext } from './hooks/useCreateOwnCapabilitiesContext';

import { useCreateThreadContext } from './hooks/useCreateThreadContext';

import { useSupersededChannelSwap } from './hooks/useSupersededChannelSwap';

import {
  AttachmentPickerContextValue,
  AttachmentPickerProvider,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  AudioPlayerContextProps,
  AudioPlayerProvider,
} from '../../contexts/audioPlayerContext/AudioPlayerContext';

import { ChannelContextValue, ChannelProvider } from '../../contexts/channelContext/ChannelContext';
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

import { ReactionData } from '../../utils/utils';
import { NotificationAnnouncer } from '../Accessibility/NotificationAnnouncer';
import { AttachmentPicker } from '../AttachmentPicker/AttachmentPicker';
import type { KeyboardCompatibleViewProps } from '../KeyboardCompatibleView/KeyboardCompatibleView';
import { useMarkRead } from '../MessageList/hooks/useMarkRead';
import { DEFAULT_HIGHLIGHT_DURATION } from '../MessageList/hooks/useMessageListFocus';
import { Emoji } from '../MessageMenu/EmojiPickerList';
import { emojis } from '../MessageMenu/emojis';
import { toUnicodeScalarString } from '../MessageMenu/utils/toUnicodeScalarString';
import { useNotificationApi } from '../Notifications';
import { getChannelNotificationHostId } from '../Notifications/notificationTarget';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

export type MarkReadFunctionOptions = {
  /**
   * Signal, whether the message paginator's unread snapshot should be updated.
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
 * Initial message-list page size. stream-chat's `MessagePaginator` defaults to 100
 * (`DEFAULT_CHANNEL_MESSAGE_LIST_PAGE_SIZE`). On native that makes the initial load — and therefore
 * every subsequent message-list commit, whose cost scales with the number of loaded messages — several
 * times heavier than necessary. We keep it to a screenful-plus-buffer; older messages load on demand
 * via pagination. Mirrors the SDK's historical initial-load size.
 */
const DEFAULT_MESSAGE_LIST_PAGE_SIZE = 25;

export type ChannelPropsWithContext = Pick<ChannelContextValue, 'channel'> &
  Partial<
    Pick<
      AttachmentPickerContextValue,
      | 'bottomInset'
      | 'topInset'
      | 'disableAttachmentPicker'
      | 'shouldRenderAttachmentPicker'
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
      | 'allowDateSeparatorForSystemMessages'
      | 'hideDateSeparators'
      | 'maxTimeBetweenGroupedMessages'
    >
  > &
  Pick<ChatContextValue, 'client'> &
  Partial<
    Pick<
      InputMessageInputContextValue,
      | 'additionalTextInputProps'
      | 'asyncMessagesLockDistance'
      | 'asyncMessagesMinimumPressDuration'
      | 'audioRecordingSendOnComplete'
      | 'asyncMessagesSlideToCancelDistance'
      | 'attachmentPickerBottomSheetHeight'
      | 'attachmentSelectionBarHeight'
      | 'audioRecordingEnabled'
      | 'compressImageQuality'
      | 'createPollOptionGap'
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
     * The notification host this channel's notifications are routed to. Defaults to the channel's
     * own host, derived from its cid.
     */
    notificationHostId?: string;
    overrideOwnCapabilities?: Partial<OwnCapabilitiesContextValue>;
    /**
     * If true, multiple audio players will be allowed to play simultaneously
     * @default true
     */
    allowConcurrentAudioPlayback?: boolean;
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

/**
 * Poll composition, resolved: the channel type's `polls` flag already ANDed with anything registered
 * through `client.config.set({ messageComposer: { polls } })`. Module scope keeps the reference stable.
 */
const composerPollsSelector = (state: MessageComposerConfig) => ({
  pollsEnabled: state.polls.enabled,
});

/**
 * The slash commands this channel type offers, as the server reports them. Lives on resolved channel
 * configuration so there is one place to read from — see `ChannelConfig.availableCommands`.
 */
const availableCommandsSelector = (state: ChannelConfig) => ({
  availableCommands: state.availableCommands,
});

const channelQuerySelector = (state: { items?: unknown[]; lastQueryError?: Error }) => ({
  blockingError: state.items?.length ? undefined : state.lastQueryError,
});

const channelStatusSelector = (state: ChannelDataState & ChannelLifecycleState) => ({
  frozen: state.data?.frozen ?? false,
  pendingDisposal: state.pendingDisposal,
});

const ChannelWithContext = (props: PropsWithChildren<ChannelPropsWithContext>) => {
  const {
    disableAttachmentPicker = !isImageMediaLibraryAvailable(),
    shouldRenderAttachmentPicker = true,
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
    enableMessageGroupingByUser = true,
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
    allowDateSeparatorForSystemMessages = false,
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
      'location',
      'text',
    ],
    messageOverlayTargetId,
    messageInputFloating = false,
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
    initializeOnMount = true,
    urlPreviewType = 'full',
  } = props;

  const components = useComponentsContext();
  const { KeyboardCompatibleView, LoadingErrorIndicator } = components;

  const { thread: threadProps, threadInstance: threadInstanceFromProps } = threadFromProps;

  const styles = useStyles();
  // The active thread is fully prop-driven: derive it synchronously during render so the reply
  // data is present on the first frame (no setState round-trip / one-frame gap). Opening a thread
  // is the integrator's job via `onThreadSelect` (they render a Channel with the `thread` prop).
  const thread = threadProps ?? null;
  const threadInstance = useMemo(() => {
    if (threadInstanceFromProps) {
      return threadInstanceFromProps;
    }
    if (!threadProps?.id || !channel) {
      return null;
    }
    return client.threads.ensure({ channel, parentMessage: threadProps });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadInstanceFromProps, threadProps?.id, channel, client]);
  const [messageInputHeightStore] = useState(() => new MessageInputHeightStore());
  const { bottomSheetRef, closePicker, openPicker } = useAttachmentPickerBottomSheet();

  // The CHANNEL's paginator. A thread's reply query fails on its own paginator and is rendered by
  // `<Thread>` — this component has no business replacing the thread UI with a channel-level error.
  const { blockingError } =
    useStateStore(channel.messagePaginator.state, channelQuerySelector) ?? {};

  const { frozen, pendingDisposal } = useStateStore(channel.state, channelStatusSelector);

  const channelId = channel?.id || '';
  const { pollsEnabled } = useStateStore(
    channel?.messageComposer?.configState,
    composerPollsSelector,
  ) ?? { pollsEnabled: false };
  const pollCreationEnabled = !pendingDisposal && !!channel?.id && pollsEnabled;

  const { addNotification } = useNotificationApi();

  const notifyJumpToFirstUnreadError = useStableCallback((error: unknown) => {
    addNotification({
      message: t(
        'channel.jumpToFirstUnreadFailed.error',
        'Failed to jump to the first unread message',
      ),
      options: {
        ...(error instanceof Error ? { originalError: error } : {}),
        severity: 'error',
        type: 'channel:jumpToFirstUnread:failed',
      },
      origin: { context: { feature: 'jumpToFirstUnread' }, emitter: 'Channel' },
    });
  });

  /**
   * Whether this list is already aimed at a message.
   *
   * There is no `messageId` prop any more: jumping is the paginator's job, so an integrator targets a
   * message by calling `paginator.jumpToMessage(...)` — from a `useLayoutEffect`, or before this
   * mounts at all — and the focus signal is what that leaves behind. `<Channel>` reads the signal so
   * it can tell a jump already happened and not overwrite it with its own jump to the first unread.
   *
   * A `useLayoutEffect` is early enough: the one consumer that races this
   * (`MessageFlashList`'s initial anchor) asks inside a passive `useEffect`, which React runs after
   * every layout effect.
   *
   * Read imperatively, not through `useStateStore`: every caller is an effect or a one-shot
   * decision, and subscribing would re-render `Channel` on every jump for no benefit.
   */
  const hasFocusTarget = useStableCallback(
    () => !!(threadInstance ?? channel).messagePaginator.messageFocusSignal.getLatestValue().signal,
  );

  const shouldLoadInitialChannelAtFirstUnreadMessage = useStableCallback((unreadCount?: number) => {
    if (hasFocusTarget() || !initialScrollToFirstUnreadMessage || !client.user) {
      return false;
    }

    return (unreadCount ?? channel.countUnread()) > 0;
  });

  const hasPendingInitialTargetLoad = useStableCallback(() => {
    return hasFocusTarget() || shouldLoadInitialChannelAtFirstUnreadMessage();
  });

  useEffect(() => {
    const initChannel = async () => {
      const unreadCount = channel.countUnread();
      const shouldLoadAtFirstUnread = shouldLoadInitialChannelAtFirstUnreadMessage(unreadCount);
      if (!channel || !shouldSyncChannel) {
        return;
      }

      // Keep the message-list page light: the list's per-update commit cost scales with the number
      // of loaded messages, and the paginator otherwise defaults to a 100-message page.
      channel.messagePaginator.pageSize = DEFAULT_MESSAGE_LIST_PAGE_SIZE;

      if (
        (!channel.initialized || !channel.messagePaginator.isActiveIntervalAtHead) &&
        initializeOnMount
      ) {
        try {
          await channel?.watch();
        } catch (err) {
          console.warn('Channel watch request failed with error:', err);
          channel.offlineMode = true;
        }
      }

      // Seed the paginator for a cold open (deep link / push). Channels reached via the channel
      // list are already seeded by client.hydrateChannels, so guard on an empty paginator
      // to avoid a redundant fetch.
      if (!channel.messagePaginator.state.getLatestValue().items?.length) {
        await channel.messagePaginator.reload();
      }

      // Re-seed the unread snapshot from the CURRENT read state on every open. The paginator is
      // usually reused from cache (the reload above is skipped), and hydrateChannels merges
      // rather than re-seeds, so without this the snapshot's boundary/count/first-unread stay frozen
      // at the very first open — making the separator, the "N new" banner and the jump-to-first-unread
      // target all go stale on reopen. Mirrors stream-chat-react, which re-seeds by re-querying on open.
      channel.messagePaginator.seedUnreadSnapshot();

      if (shouldLoadAtFirstUnread) {
        try {
          // jumpToTheFirstUnreadMessage resolves the first-unread id from the paginator's snapshot,
          // and emits messageFocusSignal for the highlight + scroll.
          await channel.messagePaginator.jumpToTheFirstUnreadMessage({
            focusSignalTtlMs: DEFAULT_HIGHLIGHT_DURATION,
          });
        } catch (error) {
          notifyJumpToFirstUnreadError(error);
        }
      }

      if (unreadCount > 0 && markReadOnMount) {
        // Keep the original unread UI (separator frozen at the boundary, "N new" banner) when
        // opening a channel with unreads — don't reset the snapshot here. It clears once the user
        // catches up (a subsequent markRead with the default updateChannelUnreadState: true).
        await markRead({ updateChannelUnreadState: false });
      }
    };

    initChannel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, shouldSyncChannel]);

  // Mark the channel active while this <Channel> is mounted. The LLC refcounts `active`, so a
  // Channel instance shared with the channel-list preview or a thread stays active until the last
  // mount unmounts. Being active enables auto-mark-read-on-focus and suppresses destructive
  // channel-list re-seeding of the open channel's message list on reconnect. `activate()` returns
  // the release for this exact activation, so swapping the `channel` prop releases the previous
  // instance before activating the new one.
  useEffect(() => channel?.activate(), [channel]);

  // Sent directly rather than through `channel.stopTyping()`, which does nothing once the socket is
  // closed, and `<Chat>` usually closes it on background before this runs.
  const handleAppBackground = useCallback(() => {
    if (!channel.isTyping || !channel.data?.own_capabilities?.includes('send-typing-events')) {
      return;
    }
    channel.sendEvent({
      event: {
        parent_id: thread?.id,
        type: 'typing.stop',
      },
    } as { event: StreamEvent });
  }, [channel, thread?.id]);

  useAppStateListener(undefined, handleAppBackground);

  /**
   * CHANNEL METHODS
   */
  // markRead is no longer placed on the ChannelContext; the message lists own their own throttled
  // instance via useMarkRead(channel). Channel still needs it internally (mark-read-on-mount + resync).
  const markRead = useMarkRead(channel);

  // Mark-read after the LLC's reconnect reload. `connection.recovered` is dispatched by
  // `client.connectionRecovery` once that reload has landed, so `hasMoreHead` read here reflects the
  // refreshed window — which is why this cannot hang off the socket's status store, which moves the
  // moment the socket does. Only the reload moved into the LLC; whether a caught-up channel is
  // marked read stays a UI decision (see `useMarkRead`).
  useEffect(() => {
    if (!shouldSyncChannel) {
      return;
    }

    // Mark read has to wait for `connection.recovered`, as it is dispatched once the reloads have
    // landed, so `hasMoreHead` read here reflects the refreshed window. Channel view only, and only
    // when that window is at the newest, only if the user has paginated up into older history so leave
    // their read state alone.
    const { unsubscribe } = client.on('connection.recovered', () => {
      if (thread || channel.messagePaginator.hasMoreHead) {
        return;
      }
      markRead();
    });

    return unsubscribe;
  }, [channel, client, markRead, shouldSyncChannel, thread]);

  /**
   * Channel configs for use in disabling local functionality.
   * Nullish coalescing is used to give first priority to props to override
   * the server settings. Then priority to server settings to override defaults.
   *
   * Read from the channel's *resolved* configuration, which carries the server's command list as
   * `availableCommands`. That is reactive, so the list no longer has to be re-read imperatively on
   * every render — and it no longer throws for a channel pending disposal, which is why the previous
   * try/catch wrapper is gone.
   */
  const { availableCommands } = useStateStore(channel?.configState, availableCommandsSelector) ?? {
    availableCommands: [],
  };

  const handleClosePicker = useStableCallback(() => closePicker(bottomSheetRef));
  const handleOpenPicker = useStableCallback(() => openPicker(bottomSheetRef));

  const attachmentPickerContext = useMemo(
    () => ({
      bottomInset,
      bottomSheetRef,
      closePicker: handleClosePicker,
      disableAttachmentPicker,
      openPicker: handleOpenPicker,
      shouldRenderAttachmentPicker,
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
      shouldRenderAttachmentPicker,
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
    disabled: frozen,
    enableMessageGroupingByUser,
    enforceUniqueReaction,
    allowDateSeparatorForSystemMessages,
    hideDateSeparators,
    hideStickyDateHeader,
    maxTimeBetweenGroupedMessages,
    hasPendingInitialTargetLoad,
    threadList,
  });

  const inputMessageInputContext = useCreateInputMessageInputContext({
    additionalTextInputProps,
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
    focusInputOnPickerClose,
    handleAttachButtonPress,
    hasCameraPicker,
    hasCommands: hasCommands ?? !!availableCommands.length,
    hasFilePicker,
    hasImagePicker,
    messageInputFloating,
    messageInputHeightStore,
    openPollCreationDialog,
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
    threadInstance,
  });

  const audioPlayerContext = useMemo<AudioPlayerContextProps>(
    () => ({ allowConcurrentAudioPlayback }),
    [allowConcurrentAudioPlayback],
  );

  const messageComposerContext = useMemo(
    () => ({ channel, threadInstance }),
    [channel, threadInstance],
  );

  if (!channel || blockingError) {
    // Retry re-runs the query that failed. A new failure lands in the paginator's `lastQueryError`,
    // which is the `error` this indicator renders off — so the warn is all the handling needed.
    const retry = () =>
      channel?.messagePaginator
        ?.jumpToTheLatestMessage()
        .catch((err: unknown) =>
          console.warn('Reloading the message list failed with error:', err),
        );

    return <LoadingErrorIndicator error={blockingError} listType='message' retry={retry} />;
  }

  if (!channel?.cid || !channel.watch) {
    return (
      <Text style={styles.selectChannel} testID='no-channel'>
        {t('channel.noneSelected.text', 'Please select a channel first')}
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
                      {shouldRenderAttachmentPicker ? <AttachmentPicker /> : null}
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
  const { client, isMessageAIGenerated } = useChatContext();
  const { t } = useTranslationContext();
  const channel = useSupersededChannelSwap(props.channel);
  const notificationHostId =
    props.notificationHostId ??
    (channel?.cid ? getChannelNotificationHostId(channel.cid) : undefined);

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

  const channelWithContext = (
    <ChannelWithContext
      {...{
        client,
        t,
      }}
      {...props}
      channel={channel}
      shouldSyncChannel={shouldSyncChannel}
      {...{
        isMessageAIGenerated,
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
