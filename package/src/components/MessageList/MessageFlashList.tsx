import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  LayoutChangeEvent,
  ScrollViewProps,
  StyleSheet,
  View,
  useColorScheme,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';

import Animated from 'react-native-reanimated';

import type { FlashListProps, FlashListRef } from '@shopify/flash-list';
import type { Channel, EventPayload, LocalMessage } from 'stream-chat';

import { useMarkRead } from './hooks/useMarkRead';
import { useMessageList } from './hooks/useMessageList';

import { useScrollToBottomAccessibilityAction } from './hooks/useScrollToBottomAccessibilityAction';
import { useShouldScrollToRecentOnNewOwnMessage } from './hooks/useShouldScrollToRecentOnNewOwnMessage';
import { useTypingUsers } from './hooks/useTypingUsers';
import { InlineLoadingMoreIndicator } from './InlineLoadingMoreIndicator';
import { InlineLoadingMoreRecentIndicator } from './InlineLoadingMoreRecentIndicator';
import { InlineLoadingMoreRecentThreadIndicator } from './InlineLoadingMoreRecentThreadIndicator';

import {
  AttachmentPickerContextValue,
  useAttachmentPickerContext,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import { ChatContextValue, useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import {
  MessageInputContextValue,
  useMessageInputContext,
} from '../../contexts/messageInputContext/MessageInputContext';
import {
  MessageListItemContextValue,
  MessageListItemProvider,
} from '../../contexts/messageListItemContext/MessageListItemContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  OwnCapabilitiesContextValue,
  useOwnCapabilitiesContext,
} from '../../contexts/ownCapabilitiesContext/OwnCapabilitiesContext';
import { mergeThemes, useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import { useStableCallback, useStateStore } from '../../hooks';
import { isVideoPlayerAvailable } from '../../native';
import { bumpOverlayLayoutRevision, useHasActiveId } from '../../state-store';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import { FileTypes } from '../../types/types';
import { transitions } from '../../utils/animations/transitions';
import { getChannelUnreadState } from '../../utils/getChannelUnreadState';
import { MarkReadFunctionOptions } from '../Channel/Channel';
import { useMessageListPagination } from '../Channel/hooks/useMessageListPagination';
import { MessageWrapper } from '../Message/MessageItemView/MessageWrapper';
import { excludeCanceledUploadNotifications } from '../Notifications/notificationFilters';
import { PortalWhileClosingView } from '../UIComponents/PortalWhileClosingView';

type FlashListContextApi = { getRef?: () => FlashListRef<LocalMessage> | null } | undefined;

let FlashList;
let useFlashListContext: () => FlashListContextApi = () => undefined;

try {
  const flashListModule = require('@shopify/flash-list');
  FlashList = flashListModule.FlashList;
  useFlashListContext = flashListModule.useFlashListContext;
} catch {
  FlashList = undefined;
}

const keyExtractor = (item: LocalMessage) => {
  if (item.id) {
    return item.id;
  }
  if (item.created_at) {
    return typeof item.created_at === 'string' ? item.created_at : item.created_at.toISOString();
  }
  return Date.now().toString();
};

const flatListViewabilityConfig: ViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 1,
};

const hasReadLastMessage = (channel: Channel, userId: string) => {
  const latestMessageIdInChannel = channel.messagePaginator.state
    .getLatestValue()
    .items?.at(-1)?.id;
  const lastReadMessageIdServer = channel.state.read[userId]?.last_read_message_id;
  return latestMessageIdInChannel === lastReadMessageIdServer;
};

const messageInputHeightStoreSelector = (state: MessageInputHeightState) => ({
  height: state.height,
});

type MessageFlashListPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'closePicker' | 'attachmentPickerStore'
> &
  Pick<OwnCapabilitiesContextValue, 'readEvents'> &
  Pick<
    ChannelContextValue,
    | 'channel'
    | 'disabled'
    | 'hideStickyDateHeader'
    | 'highlightedMessageId'
    | 'loadChannelAroundMessage'
    | 'loading'
    | 'reloadChannel'
    | 'scrollToFirstUnreadThreshold'
    | 'hasPendingInitialTargetLoad'
    | 'threadList'
    | 'maximumMessageLimit'
  > &
  Pick<ChatContextValue, 'client'> &
  Pick<
    MessageInputContextValue,
    'allowSendBeforeAttachmentsUpload' | 'messageInputFloating' | 'messageInputHeightStore'
  > & {
    loadMore: () => Promise<void>;
    loadMoreRecent: () => Promise<void>;
    markRead: (options?: MarkReadFunctionOptions) => void;
    loadingMore?: boolean;
    loadingMoreRecent?: boolean;
  } & Pick<
    MessagesContextValue,
    'disableTypingIndicator' | 'FlatList' | 'myMessageTheme' | 'shouldShowUnreadUnderlay'
  > &
  Pick<ThreadContextValue, 'threadInstance'> & {
    /**
     * Besides existing (default) UX behavior of underlying FlatList of MessageList component, if you want
     * to attach some additional props to underlying FlatList, you can add it to following prop.
     *
     * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
     *
     * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
     *
     * e.g.
     * ```js
     * <MessageList
     *  additionalFlatListProps={{ bounces: true, keyboardDismissMode: true }} />
     * ```
     */
    additionalFlashListProps?: Partial<FlashListProps<LocalMessage>>;
    /**
     * UI component for footer of message list. By default message list will use `InlineLoadingMoreIndicator`
     * as FooterComponent. If you want to implement your own inline loading indicator, you can access `loadingMore`
     * from context.
     *
     * This is a [ListHeaderComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header by default if inverted is true or defaulted
     */
    FooterComponent?: React.ComponentType;
    /**
     * UI component for header of message list. By default message list will use `InlineLoadingMoreRecentIndicator`
     * as HeaderComponent. If you want to implement your own inline loading indicator, you can access `loadingMoreRecent`
     * from context.
     *
     * This is a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header if inverted is false
     */
    HeaderComponent?: React.ComponentType<{ loadingMore?: boolean }>;
    /** Whether or not the FlatList is inverted. Defaults to true */
    inverted?: boolean;
    /** Turn off grouping of messages by user */
    noGroupByUser?: boolean;
    onListScroll?: ScrollViewProps['onScroll'];
    /**
     * Handler to open the thread on message. This is callback for touch event for replies button.
     *
     * @param message A message object to open the thread upon.
     */
    onThreadSelect?: (message: LocalMessage | null) => void;
    /**
     * Use `setFlatListRef` to get access to ref to inner FlatList.
     *
     * e.g.
     * ```js
     * <MessageList
     *  setFlatListRef={(ref) => {
     *    // Use ref for your own good
     *  }}
     * ```
     */
    setFlatListRef?: (ref: FlashListRef<LocalMessage> | null) => void;
    /**
     * If true, the message list will be used in a live-streaming scenario.
     * This flag is used to make sure that the auto scroll behaves well, if multiple messages are received.
     *
     * This flag is experimental and is subject to change. Please test thoroughly before using it.
     *
     * @experimental
     */
    isLiveStreaming?: boolean;
  };

const WAIT_FOR_SCROLL_TIMEOUT = 0;

// Classify an attachment bearing message by its primary shape so FlashList only
// recycles same shaped cells (means less work to rerender). Gallery/media is the
// heaviest subtree to mount, so we short circuit to it as soon as we see one gallery
// image/video nad this keeps gallery cells recycling only with other gallery cells,
// so the Gallery subtree reconciles on rebind instead of unmount & remount. Mirrors
// the attachment categorization in Message.
const getAttachmentItemType = (message: LocalMessage) => {
  const attachments = message.attachments ?? [];
  let hasGiphy = false;
  let hasAudio = false;
  let hasFile = false;
  let hasCard = false;
  for (const attachment of attachments) {
    const isGalleryImage =
      attachment.type === FileTypes.Image &&
      !attachment.og_scrape_url &&
      !attachment.title_link &&
      (!!attachment.image_url || !!attachment.thumb_url);
    const isGalleryVideo =
      attachment.type === FileTypes.Video && !attachment.og_scrape_url && isVideoPlayerAvailable();
    if (isGalleryImage || isGalleryVideo) {
      return 'message-with-gallery';
    }
    if (attachment.type === FileTypes.Giphy) {
      hasGiphy = true;
    } else if (
      attachment.type === FileTypes.Audio ||
      attachment.type === FileTypes.VoiceRecording
    ) {
      hasAudio = true;
    } else if (attachment.type === FileTypes.File) {
      hasFile = true;
    } else if (attachment.og_scrape_url || attachment.title_link) {
      hasCard = true;
    }
  }
  if (hasGiphy) {
    return 'message-with-giphy';
  }
  if (hasAudio) {
    return 'message-with-audio';
  }
  if (hasFile) {
    return 'message-with-file';
  }
  if (hasCard) {
    return 'message-with-card';
  }
  return 'message-with-attachments';
};

const getItemTypeInternal = (message: LocalMessage) => {
  if (message.type === 'regular') {
    if ((message.attachments?.length ?? 0) > 0) {
      return getAttachmentItemType(message);
    }

    if (message.poll_id) {
      return 'message-with-poll';
    }

    if (message.quoted_message_id) {
      return 'message-with-quote';
    }

    if (message.shared_location) {
      return 'message-with-shared-location';
    }

    if (message.text) {
      return 'message-with-text';
    }

    return 'message-with-nothing';
  }

  if (message.type === 'deleted') {
    return 'deleted-message';
  }

  if (message.type === 'system') {
    return 'system-message';
  }

  return 'generic-message';
};

const messageFocusSelector = (state: {
  signal: { messageId?: string; token?: number } | null;
}) => ({
  focusedMessageId: state.signal?.messageId,
  focusToken: state.signal?.token,
});

const MessageFlashListWithContext = (props: MessageFlashListPropsWithContext) => {
  const LoadingMoreRecentIndicator = props.threadList
    ? InlineLoadingMoreRecentThreadIndicator
    : InlineLoadingMoreRecentIndicator;
  const {
    allowSendBeforeAttachmentsUpload,
    attachmentPickerStore,
    additionalFlashListProps,
    channel,
    client,
    closePicker,
    disabled,
    disableTypingIndicator,
    // FlatList,
    FooterComponent,
    HeaderComponent = InlineLoadingMoreIndicator,
    hideStickyDateHeader,
    isLiveStreaming = false,
    loadChannelAroundMessage,
    loading,
    loadingMore,
    loadingMoreRecent,
    loadMore,
    loadMoreRecent,
    markRead,
    maximumMessageLimit,
    messageInputFloating,
    messageInputHeightStore,
    myMessageTheme,
    readEvents,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    reloadChannel,
    setFlatListRef,
    hasPendingInitialTargetLoad,
    threadInstance,
    threadList = false,
  } = props;
  const {
    AutoCompleteSuggestionList,
    EmptyStateIndicator,
    MessageListLoadingIndicator: LoadingIndicator,
    NetworkDownIndicator,
    NotificationList,
    ScrollToBottomButton,
    StickyHeader,
    TypingIndicator,
    TypingIndicatorContainer,
    UnreadMessagesNotification,
  } = useComponentsContext();
  const flashListRef = useRef<FlashListRef<LocalMessage> | null>(null);

  const { height: messageInputHeight } = useStateStore(
    messageInputHeightStore.store,
    messageInputHeightStoreSelector,
  );

  const [hasMoved, setHasMoved] = useState(false);
  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);
  const [isAppActive, setIsAppActive] = useState(() => AppState.currentState === 'active');
  const isNewestMessageVisibleRef = useRef(false);
  const [isUnreadNotificationOpen, setIsUnreadNotificationOpen] = useState<boolean>(false);
  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date | undefined>();
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  const stickyHeaderDateRef = useRef<Date | undefined>(undefined);
  /**
   * We want to call onEndReached and onStartReached only once, per content length.
   * We keep track of calls to these functions per content length, with following trackers.
   */
  const onStartReachedTracker = useRef<Record<number, boolean>>({});
  const onEndReachedTracker = useRef<Record<number, boolean>>({});

  const onStartReachedInPromise = useRef<Promise<void> | null>(null);
  const onEndReachedInPromise = useRef<Promise<void> | null>(null);

  /**
   * The timeout id used to debounce our scrollToIndex calls on messageList updates
   */
  const scrollToDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const channelResyncScrollSet = useRef<boolean>(true);
  const { theme } = useTheme();
  const styles = useStyles();

  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);
  const scheme = useColorScheme();

  const modifiedTheme = useMemo(
    () => mergeThemes({ scheme, style: myMessageTheme, theme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myMessageThemeString, scheme, theme],
  );

  const { processedMessageList, rawMessageList, viewabilityChangedCallback } = useMessageList({
    isFlashList: true,
    isLiveStreaming,
    maximumMessageLimit,
    threadList,
  });

  const renderItem = useCallback(
    ({ item: message, index }: { item: LocalMessage; index: number }) => {
      const previousMessage = processedMessageList[index - 1];
      const nextMessage = processedMessageList[index + 1];
      return (
        <MessageWrapper
          message={message}
          previousMessage={previousMessage}
          nextMessage={nextMessage}
        />
      );
    },
    [processedMessageList],
  );

  /**
   * We need topMessage and channelLastRead values to set the initial scroll position.
   * So these values only get used if `initialScrollToFirstUnreadMessage` prop is true.
   */
  const topMessageBeforeUpdate = useRef<LocalMessage>(undefined);
  const topMessageAfterUpdate: LocalMessage | undefined = rawMessageList[0];

  const latestNonCurrentMessageBeforeUpdateRef = useRef<LocalMessage>(undefined);

  const messageListLengthBeforeUpdate = useRef(0);
  const messageListLengthAfterUpdate = processedMessageList.length;

  const shouldScrollToRecentOnNewOwnMessageRef = useShouldScrollToRecentOnNewOwnMessage(
    rawMessageList,
    client.userID,
  );

  const [autoscrollToRecent, setAutoscrollToRecent] = useState(true);

  useEffect(() => {
    if (autoscrollToRecent && flashListRef.current) {
      if (hasPendingInitialTargetLoad?.()) {
        return;
      }

      flashListRef.current.scrollToEnd({
        animated: true,
      });
    }
  }, [autoscrollToRecent, hasPendingInitialTargetLoad]);

  // While the message overlay is open we suppress autoscroll-to-recent so that
  // incoming messages do not shift visible content and invalidate the overlay's
  // anchored geometry. Content anchoring (startRenderingFromBottom) stays on.
  const isOverlayOpen = useHasActiveId();

  const maintainVisibleContentPosition = useMemo(() => {
    return {
      animateAutoscrollToBottom: true,
      autoscrollToBottomThreshold: autoscrollToRecent && !isOverlayOpen ? 1 : undefined,
      startRenderingFromBottom: true,
    };
  }, [isOverlayOpen, autoscrollToRecent]);

  useEffect(() => {
    if (disabled) {
      setScrollToBottomButtonVisible(false);
    }
  }, [disabled]);

  // Scroll-to-target is driven by the paginator's messageFocusSignal (thread-aware): a jump emits
  // it, and the effect below scrolls to it. `token` re-fires the effect on every jump (even to the
  // same id); see MessageList for the full rationale.
  const focusPaginator = threadList ? threadInstance?.messagePaginator : channel.messagePaginator;
  const { focusedMessageId, focusToken } =
    useStateStore(focusPaginator?.messageFocusSignal, messageFocusSelector) ?? {};
  const lastFocusScrollTokenRef = useRef<number | undefined>(undefined);

  // Clear the focus/highlight signal on unmount (or when switching channel/thread). The signal
  // lives on the LLC paginator, which outlives this component — without this, a highlight still
  // active when you navigate away re-fires the scroll+highlight on return (the scroll-token ref
  // resets on remount). Mirrors the old React-state highlight that cleaned up on unmount.
  useEffect(() => {
    const paginator = focusPaginator;
    return () => paginator?.clearMessageFocusSignal();
  }, [focusPaginator]);

  /**
   * Scrolls to the focused message (messageFocusSignal) once it's rendered. Re-attempts when the
   * list updates while a focus is pending, and marks each focus token handled so unrelated list
   * changes during the highlight window don't re-scroll.
   */
  useEffect(() => {
    if (!focusedMessageId || focusToken === lastFocusScrollTokenRef.current) {
      return;
    }

    const indexOfParentInMessageList = processedMessageList.findIndex(
      (message) => message?.id === focusedMessageId,
    );

    // Not in the rendered window yet (jumpToMessage already loaded-around it, so a later
    // processedMessageList change re-runs this) — bail rather than re-jump (no jump↔effect loop).
    if (indexOfParentInMessageList === -1) {
      return;
    }

    lastFocusScrollTokenRef.current = focusToken;
    scrollToDebounceTimeoutRef.current = setTimeout(async () => {
      clearTimeout(scrollToDebounceTimeoutRef.current);

      const scrollToIndex = async () => {
        const list = flashListRef.current;

        if (!list) {
          return false;
        }

        await list.scrollToIndex({
          animated: true,
          index: indexOfParentInMessageList,
          viewPosition: 0.5,
        });

        return true;
      };

      await scrollToIndex();
      requestAnimationFrame(async () => {
        await scrollToIndex();
      });
      // Start the highlight's auto-dismiss countdown now that the message is scrolled into view.
      // The LLC deliberately does NOT start it on emit (the message may not be visible yet), so
      // without this the highlight would persist forever.
      focusPaginator?.scheduleMessageFocusSignalClear({ token: focusToken });
    }, WAIT_FOR_SCROLL_TIMEOUT);
  }, [focusPaginator, focusToken, focusedMessageId, processedMessageList]);

  const goToMessage = useStableCallback(async (messageId: string) => {
    // jumpToMessage loads-around + emits messageFocusSignal → the effect scrolls and highlights.
    await loadChannelAroundMessage({ messageId });
  });

  useEffect(() => {
    /**
     * Condition to check if a message is removed from MessageList.
     * Eg: This would happen when giphy search is cancelled, message is deleted with visibility "never" etc.
     * If such a case arises, we scroll to bottom.
     */
    const isMessageRemovedFromMessageList =
      messageListLengthBeforeUpdate.current - messageListLengthAfterUpdate === 1;

    /**
     * Scroll down when
     * created_at timestamp of top message before update is lesser than created_at timestamp of top message after update - channel has resynced
     */
    const scrollToBottomIfNeeded = () => {
      if (!client || !channel || processedMessageList.length === 0) {
        return;
      }

      if (
        isMessageRemovedFromMessageList ||
        (topMessageBeforeUpdate.current?.created_at &&
          topMessageAfterUpdate?.created_at &&
          topMessageBeforeUpdate.current.created_at < topMessageAfterUpdate.created_at)
      ) {
        channelResyncScrollSet.current = false;
        setScrollToBottomButtonVisible(false);
        resetPaginationTrackersRef.current();

        setTimeout(() => {
          channelResyncScrollSet.current = true;
          if (channel.countUnread() > 0) {
            markRead();
          }
        }, WAIT_FOR_SCROLL_TIMEOUT);
      }
    };

    if (isMessageRemovedFromMessageList && !maximumMessageLimit) {
      scrollToBottomIfNeeded();
    }

    messageListLengthBeforeUpdate.current = messageListLengthAfterUpdate;
    topMessageBeforeUpdate.current = topMessageAfterUpdate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageListLengthAfterUpdate, topMessageAfterUpdate?.id, maximumMessageLimit]);

  useEffect(() => {
    if (!processedMessageList.length) {
      return;
    }

    const notLatestSet = channel.messagePaginator.state.getLatestValue().hasMoreHead;
    if (notLatestSet) {
      latestNonCurrentMessageBeforeUpdateRef.current =
        channel.messagePaginator.lastMessage ?? undefined;
      setAutoscrollToRecent(false);
      setScrollToBottomButtonVisible(true);
      return;
    } else {
      setAutoscrollToRecent(true);
    }
    const latestNonCurrentMessageBeforeUpdate = latestNonCurrentMessageBeforeUpdateRef.current;
    latestNonCurrentMessageBeforeUpdateRef.current = undefined;

    const latestCurrentMessageAfterUpdate = processedMessageList[processedMessageList.length - 1];
    if (!latestCurrentMessageAfterUpdate) {
      return;
    }
    const didMergeMessageSetsWithNoUpdates =
      latestNonCurrentMessageBeforeUpdate?.id === latestCurrentMessageAfterUpdate.id;

    if (!didMergeMessageSetsWithNoUpdates) {
      const shouldScrollToRecentOnNewOwnMessage = shouldScrollToRecentOnNewOwnMessageRef.current();
      // we should scroll to bottom where ever we are now
      // as we have sent a new own message
      if (shouldScrollToRecentOnNewOwnMessage) {
        flashListRef.current?.scrollToEnd({
          animated: true,
        });
      }
    }
  }, [channel, processedMessageList, shouldScrollToRecentOnNewOwnMessageRef, threadList]);

  /**
   * Track app foreground/background. Combined with viewability (above) it decides whether we are
   * "viewing live"; the LLC skips the unread bump while live (see `messagePaginator.isViewingLive`).
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) =>
      setIsAppActive(nextAppState === 'active'),
    );
    return () => subscription.remove();
  }, []);

  /**
   * Push the "viewing live" signal when the app foreground state changes (viewability pushes it on
   * scroll). Reset to false on unmount / channel switch so a backgrounded or torn-down list never
   * suppresses unread counting.
   */
  useEffect(() => {
    const { messagePaginator } = channel;
    messagePaginator.setViewingLive(isAppActive && isNewestMessageVisibleRef.current);
    return () => messagePaginator.setViewingLive(false);
  }, [channel, isAppActive]);

  /**
   * Mark the channel read when a message arrives while the user is viewing the latest messages.
   * The LLC skips the unread bump while live, so — unlike before — no synchronous snapshot reset is
   * needed here (that was the fragile bump-then-undo); we just tell the server.
   */
  useEffect(() => {
    const shouldMarkRead = () => {
      const channelUnreadState = getChannelUnreadState(channel);
      return (
        channel.messagePaginator.isViewingLive &&
        !channelUnreadState?.first_unread_message_id &&
        client.user?.id &&
        !hasReadLastMessage(channel, client.user?.id)
      );
    };

    const handleEvent = (event: EventPayload<'message.new'>) => {
      const mainChannelUpdated = !event.message?.parent_id || event.message?.show_in_channel;
      if (mainChannelUpdated && shouldMarkRead()) {
        markRead();
      }
    };

    const listener: ReturnType<typeof channel.on> = channel.on('message.new', handleEvent);

    return () => {
      listener?.unsubscribe();
    };
  }, [channel, client.user?.id, markRead]);

  const updateStickyHeaderDateIfNeeded = useStableCallback((viewableItems: ViewToken[]) => {
    if (!viewableItems.length) {
      return;
    }

    const lastItem = viewableItems[0];

    if (!lastItem) return;

    if (!channel.messagePaginator.hasMoreTail && processedMessageList[0].id === lastItem.item.id) {
      setStickyHeaderDate(undefined);
      return;
    }
    const isMessageTypeDeleted = lastItem.item.type === 'deleted';

    if (
      lastItem?.item?.created_at &&
      !isMessageTypeDeleted &&
      typeof lastItem.item.created_at !== 'string' &&
      lastItem.item.created_at.toDateString() !== stickyHeaderDateRef.current?.toDateString()
    ) {
      stickyHeaderDateRef.current = lastItem.item.created_at;
      setStickyHeaderDate(lastItem.item.created_at);
    }
  });

  /**
   * This function should show or hide the unread indicator depending on the
   */
  const updateStickyUnreadIndicator = useStableCallback((viewableItems: ViewToken[]) => {
    const channelUnreadState = getChannelUnreadState(channel);
    // we need this check to make sure that regular list change do not trigger
    // the unread notification to appear (for example if the old last read messages
    // go out of the viewport).
    const lastReadMessageId = channelUnreadState?.last_read_message_id;
    const lastReadMessageVisible = viewableItems.some((item) => item.item.id === lastReadMessageId);

    // Channels with disabled `read-events` (i.e livestreams) still surface the unread
    // notification when the client opted into a local unread count, so the gate accepts
    // either source.
    const unreadNotificationSupported = readEvents || client.options.isLocalUnreadCountEnabled;

    if (
      !viewableItems.length ||
      !unreadNotificationSupported ||
      lastReadMessageVisible ||
      attachmentPickerStore.state.getLatestValue().selectedPicker === 'images'
    ) {
      setIsUnreadNotificationOpen(false);
      return;
    }

    const lastItem = viewableItems[0];

    if (!lastItem) return;

    const lastItemMessage = lastItem.item;
    const lastItemCreatedAt = lastItemMessage.created_at;

    const unreadIndicatorDate = channelUnreadState?.last_read?.getTime();
    const lastItemDate = lastItemCreatedAt.getTime();

    if (
      !channel.messagePaginator.hasMoreTail &&
      processedMessageList[0].id === lastItemMessage.id
    ) {
      setIsUnreadNotificationOpen(false);
      return;
    }
    /**
     * This is a special case where there is a single long message by the sender.
     * When a message is sent, we mark it as read before it actually has a `created_at` timestamp.
     * This is a workaround to prevent the unread indicator from showing when the message is sent.
     */
    if (
      viewableItems.length === 1 &&
      channel.countUnread() === 0 &&
      lastItemMessage.user.id === client.userID
    ) {
      setIsUnreadNotificationOpen(false);
      return;
    }
    if (unreadIndicatorDate && lastItemDate > unreadIndicatorDate) {
      setIsUnreadNotificationOpen(true);
    } else {
      setIsUnreadNotificationOpen(false);
    }
  });

  /**
   * FlatList doesn't accept changeable function for onViewableItemsChanged prop.
   * Thus useRef.
   */
  const unstableOnViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken[] | undefined;
  }) => {
    if (!viewableItems) {
      return;
    }
    viewabilityChangedCallback({ inverted: false, viewableItems });
    if (!hideStickyDateHeader) {
      updateStickyHeaderDateIfNeeded(viewableItems);
    }
    updateStickyUnreadIndicator(viewableItems);

    // Report whether the user is viewing the latest messages (the newest channel message is on
    // screen) so the LLC can skip the unread bump while live (see `messagePaginator.isViewingLive`).
    // Viewability reflects the real layout, so this is correct even at mount — a channel opened at
    // its first unread has the newest message off-screen and therefore reports `false`.
    // The newest message comes from the paginator (what the list actually renders), not
    // channel.state.latestMessages. The last loaded item is the true newest only when the head is
    // loaded (`!hasMoreHead`) — if newer messages exist beyond the loaded window we're not live even
    // when the last loaded item is visible.
    const paginatorState = channel.messagePaginator.state.getLatestValue();
    const loadedItems = paginatorState.items ?? [];
    const newestMessageId = paginatorState.hasMoreHead
      ? undefined
      : loadedItems[loadedItems.length - 1]?.id;
    isNewestMessageVisibleRef.current =
      !!newestMessageId &&
      viewableItems.some((viewable) => viewable.item.message?.id === newestMessageId);
    channel.messagePaginator.setViewingLive(isAppActive && isNewestMessageVisibleRef.current);
  };

  const onViewableItemsChanged = useRef(unstableOnViewableItemsChanged);
  onViewableItemsChanged.current = unstableOnViewableItemsChanged;

  const stableOnViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] | undefined }) => {
      onViewableItemsChanged.current({ viewableItems });
    },
    [],
  );

  const setNativeScrollability = useStableCallback((value: boolean) => {
    // FlashList does not have setNativeProps exposed, hence we cannot use that.
    // Instead, we resort to state.
    setScrollEnabled(value);
  });

  const messageListItemContextValue: MessageListItemContextValue = useMemo(
    () => ({
      goToMessage,
      modifiedTheme,
      noGroupByUser,
      onThreadSelect,
      setNativeScrollability,
    }),
    [goToMessage, modifiedTheme, noGroupByUser, onThreadSelect, setNativeScrollability],
  );

  /**
   * We are keeping full control on message pagination, and not relying on react-native for it.
   * The reasons being,
   * 1. FlatList doesn't support onStartReached prop
   * 2. `onEndReached` function prop available on react-native, gets executed
   *    once per content length (and thats actually a nice optimization strategy).
   *    But it also means, we always need to prioritize onEndReached above our
   *    logic for `onStartReached`.
   * 3. `onEndReachedThreshold` prop decides - at which scroll position to call `onEndReached`.
   *    Its a factor of content length (which is necessary for "real" infinite scroll). But on
   *    the other hand, it also makes calls to `onEndReached` (and this `channel.query`) way
   *    too early during scroll, which we don't really need. So we are going to instead
   *    keep some fixed offset distance, to decide when to call `loadMore` or `loadMoreRecent`.
   *
   * We are still gonna keep the optimization, which react-native does - only call onEndReached
   * once per content length.
   */

  /**
   * 1. Makes a call to `loadMore` function, which queries more older messages.
   * 2. Ensures that we call `loadMore`, once per content length
   * 3. If the call to `loadMoreRecent` is in progress, we wait for it to finish to make sure scroll doesn't jump.
   */
  const maybeCallOnStartReached = useStableCallback(async () => {
    // If onEndReached has already been called for given messageList length, then ignore.
    if (
      processedMessageList?.length &&
      onStartReachedTracker.current[processedMessageList.length]
    ) {
      return;
    }

    if (processedMessageList?.length) {
      onStartReachedTracker.current[processedMessageList.length] = true;
    }

    const callback = () => {
      onStartReachedInPromise.current = null;
      return Promise.resolve();
    };

    const onError = () => {
      /** Release the onEndReachedTracker trigger after 2 seconds, to try again */
      setTimeout(() => {
        onStartReachedTracker.current = {};
      }, 2000);
    };

    // If onStartReached is in progress, better to wait for it to finish for smooth UX
    if (onEndReachedInPromise.current) {
      await onEndReachedInPromise.current;
    }
    onStartReachedInPromise.current = (
      threadList && threadInstance ? threadInstance.messagePaginator.toHead() : loadMoreRecent()
    )
      .then(callback)
      .catch(onError);
  });

  /**
   * 1. Makes a call to `loadMoreRecent` function, which queries more recent messages.
   * 2. Ensures that we call `loadMoreRecent`, once per content length
   * 3. If the call to `loadMore` is in progress, we wait for it to finish to make sure scroll doesn't jump.
   */
  const maybeCallOnEndReached = useStableCallback(async () => {
    // If onStartReached has already been called for given data length, then ignore.
    if (processedMessageList?.length && onEndReachedTracker.current[processedMessageList.length]) {
      return;
    }

    if (processedMessageList?.length) {
      onEndReachedTracker.current[processedMessageList.length] = true;
    }

    const callback = () => {
      onEndReachedInPromise.current = null;

      return Promise.resolve();
    };

    const onError = () => {
      /** Release the onStartReached trigger after 2 seconds, to try again */
      setTimeout(() => {
        onEndReachedTracker.current = {};
      }, 2000);
    };

    // If onEndReached is in progress, better to wait for it to finish for smooth UX
    if (onStartReachedInPromise.current) {
      await onStartReachedInPromise.current;
    }

    onEndReachedInPromise.current = (
      threadList ? (threadInstance?.messagePaginator.toTail() ?? Promise.resolve()) : loadMore()
    )
      .then(callback)
      .catch(onError);
  });

  const onUserScrollEvent: NonNullable<ScrollViewProps['onScroll']> = useStableCallback((event) => {
    const nativeEvent = event.nativeEvent;
    const offset = nativeEvent.contentOffset.y;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;
    if (!channel || !channelResyncScrollSet.current) {
      return;
    }

    // Check if scroll has reached either start of end of list.
    const isScrollAtEnd = offset < 100;
    const isScrollAtStart = contentLength - visibleLength - offset < 100;

    if (isScrollAtEnd) {
      maybeCallOnEndReached();
    }

    if (isScrollAtStart) {
      maybeCallOnStartReached();
    }
  });

  /**
   * Resets the pagination trackers, doing so cancels currently scheduled loading more calls
   */
  const resetPaginationTrackersRef = useRef(() => {
    onStartReachedTracker.current = {};
    onEndReachedTracker.current = {};
  });

  const currentScrollOffsetRef = useRef(0);

  const handleScroll: ScrollViewProps['onScroll'] = useStableCallback((event) => {
    const messageListHasMessages = processedMessageList.length > 0;
    const nativeEvent = event.nativeEvent;
    const offset = nativeEvent.contentOffset.y;
    currentScrollOffsetRef.current = offset;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;

    const isScrollAtStart = contentLength - visibleLength - offset < messageInputHeight;

    const notLatestSet = channel.messagePaginator.state.getLatestValue().hasMoreHead;

    const showScrollToBottomButton =
      messageListHasMessages && ((!threadList && notLatestSet) || !isScrollAtStart);

    /**
     * 1. If I scroll up -> show scrollToBottom button.
     * 2. If I scroll to bottom of screen
     *    |-> hide scrollToBottom button.
     *    |-> if channel is unread, call markRead().
     */
    setScrollToBottomButtonVisible(showScrollToBottomButton);

    if (onListScroll) {
      onListScroll(event);
    }
  });

  const goToNewMessages = useStableCallback(async () => {
    const isNotLatestSet = channel.messagePaginator.state.getLatestValue().hasMoreHead;

    if (isNotLatestSet) {
      resetPaginationTrackersRef.current();
      await reloadChannel();
    } else if (flashListRef.current) {
      flashListRef.current.scrollToEnd({
        animated: true,
      });
    }

    setScrollToBottomButtonVisible(false);
    /**
     *  When we are not in the bottom of the list, and we receive new messages, we need to mark the channel as read.
     We would still need to show the unread label, where the first unread message appeared so we don't update the channelUnreadState.
     */
    await markRead({
      updateChannelUnreadState: false,
    });
  });

  // Non-reactive read for the accessibility action label only (the button owns its own reactive
  // count). Refreshes on the list's normal re-renders (e.g. scroll), which is sufficient for a11y.
  const scrollToBottomUnreadCount =
    scrollToBottomButtonVisible && !threadList ? channel?.countUnread() : undefined;
  const {
    accessibilityActions: messageListAccessibilityActions,
    onAccessibilityAction: messageListOnAccessibilityAction,
  } = useScrollToBottomAccessibilityAction({
    accessibilityActions: additionalFlashListProps?.accessibilityActions,
    onAccessibilityAction: additionalFlashListProps?.onAccessibilityAction,
    onScrollToBottom: goToNewMessages,
    unreadCount: scrollToBottomUnreadCount,
    visible: scrollToBottomButtonVisible,
  });

  const dismissImagePicker = useStableCallback(() => {
    if (attachmentPickerStore.state.getLatestValue().selectedPicker) {
      attachmentPickerStore.setSelectedPicker(undefined);
      closePicker();
    }
  });

  const onScrollBeginDrag: ScrollViewProps['onScrollBeginDrag'] = useStableCallback((event) => {
    !hasMoved && attachmentPickerStore.state.getLatestValue().selectedPicker && setHasMoved(true);
    onUserScrollEvent(event);
  });

  const onScrollEndDrag: ScrollViewProps['onScrollEndDrag'] = useStableCallback((event) => {
    hasMoved && attachmentPickerStore.state.getLatestValue().selectedPicker && setHasMoved(false);
    onUserScrollEvent(event);
  });

  const refCallback = useStableCallback((ref: FlashListRef<LocalMessage>) => {
    flashListRef.current = ref;

    if (setFlatListRef) {
      setFlatListRef(ref);
    }
  });

  const onUnreadNotificationClose = useStableCallback(async () => {
    await markRead();
    setIsUnreadNotificationOpen(false);
  });

  // We need to omit the style related props from the additionalFlatListProps and add them directly instead of spreading
  let additionalFlashListPropsExcludingStyle:
    | Omit<NonNullable<typeof additionalFlashListProps>, 'style' | 'contentContainerStyle'>
    | undefined;

  if (additionalFlashListProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentContainerStyle, style, ...rest } = additionalFlashListProps;
    additionalFlashListPropsExcludingStyle = rest;
  }

  const flatListStyle = useMemo(
    () => [styles.listContainer, additionalFlashListProps?.style],
    [additionalFlashListProps?.style, styles.listContainer],
  );

  const flatListContentContainerStyle = useMemo(
    () => [
      styles.contentContainer,
      { paddingBottom: messageInputFloating ? messageInputHeight : 0 },
      additionalFlashListProps?.contentContainerStyle,
    ],
    [
      additionalFlashListProps?.contentContainerStyle,
      styles.contentContainer,
      messageInputFloating,
      messageInputHeight,
    ],
  );

  const currentListHeightRef = useRef<number | undefined>(undefined);

  const onLayout = useStableCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (!currentListHeightRef.current) {
      currentListHeightRef.current = height;
      return;
    }

    const closeCorrectionDeltaY = height - currentListHeightRef.current;
    bumpOverlayLayoutRevision(closeCorrectionDeltaY);

    const changedBy = currentListHeightRef.current - height;
    flashListRef.current?.getNativeScrollRef()?.setNativeProps({
      contentOffset: { x: 0, y: flashListRef.current?.getAbsoluteLastScrollOffset() + changedBy },
    });
    currentListHeightRef.current = height;
  });

  const ListHeaderComponent = useCallback(
    () => <HeaderComponent loadingMore={loadingMore} />,
    [HeaderComponent, loadingMore],
  );

  const ListFooterComponent = useCallback(() => {
    if (FooterComponent) {
      return <FooterComponent />;
    }

    return (
      <FlashListFooterTypingAdapter enabled={!disableTypingIndicator && !!TypingIndicator}>
        <LoadingMoreRecentIndicator loadingMoreRecent={loadingMoreRecent} />
        {!disableTypingIndicator && TypingIndicator && (
          <TypingIndicatorContainer>
            <TypingIndicator />
          </TypingIndicatorContainer>
        )}
      </FlashListFooterTypingAdapter>
    );
  }, [
    FooterComponent,
    LoadingMoreRecentIndicator,
    loadingMoreRecent,
    TypingIndicator,
    TypingIndicatorContainer,
    disableTypingIndicator,
  ]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingIndicator listType='message' />
      </View>
    );
  }

  if (!FlashList) {
    throw new Error(
      'The package @shopify/flash-list is not installed. Installing this package will enable the use of the FlashList component.',
    );
  }

  return (
    <View onLayout={onLayout} style={styles.container} testID='message-flat-list-wrapper'>
      {processedMessageList.length === 0 && !threadInstance ? (
        <View style={styles.flex} testID='empty-state'>
          {EmptyStateIndicator ? <EmptyStateIndicator listType='message' /> : null}
        </View>
      ) : (
        <MessageListItemProvider value={messageListItemContextValue}>
          <FlashList
            contentContainerStyle={flatListContentContainerStyle}
            data={processedMessageList}
            drawDistance={800}
            getItemType={getItemTypeInternal}
            keyboardShouldPersistTaps='handled'
            keyExtractor={keyExtractor}
            ListFooterComponent={ListFooterComponent}
            ListHeaderComponent={ListHeaderComponent}
            maintainVisibleContentPosition={maintainVisibleContentPosition}
            onMomentumScrollEnd={onUserScrollEvent}
            onScroll={handleScroll}
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            onTouchEnd={dismissImagePicker}
            onViewableItemsChanged={stableOnViewableItemsChanged}
            ref={refCallback}
            renderItem={renderItem}
            scrollEnabled={scrollEnabled}
            scrollEventThrottle={isLiveStreaming ? 16 : undefined}
            showsVerticalScrollIndicator={false}
            style={flatListStyle}
            testID='message-flash-list'
            viewabilityConfig={flatListViewabilityConfig}
            {...additionalFlashListPropsExcludingStyle}
            accessibilityActions={messageListAccessibilityActions}
            onAccessibilityAction={messageListOnAccessibilityAction}
          />
        </MessageListItemProvider>
      )}
      <View
        accessibilityElementsHidden
        accessible={false}
        importantForAccessibility='no-hide-descendants'
        style={styles.stickyHeaderContainer}
      >
        {messageListLengthAfterUpdate && StickyHeader ? (
          <StickyHeader date={stickyHeaderDate} />
        ) : null}
      </View>
      <Animated.View
        layout={transitions.layout200}
        style={[
          styles.scrollToBottomButtonContainer,
          {
            bottom: messageInputFloating
              ? messageInputHeight + primitives.spacingMd
              : primitives.spacingMd,
          },
        ]}
      >
        <ScrollToBottomButton
          onPress={goToNewMessages}
          showNotification={scrollToBottomButtonVisible}
        />
      </Animated.View>
      <NetworkDownIndicator />
      {isUnreadNotificationOpen && !threadList ? (
        <View style={styles.unreadMessagesNotificationContainer}>
          <UnreadMessagesNotification
            markRead={markRead}
            onCloseHandler={onUnreadNotificationClose}
          />
        </View>
      ) : null}
      <Animated.View
        layout={transitions.layout200}
        style={[
          {
            bottom: messageInputFloating ? messageInputHeight + 16 : 0,
          },
          styles.suggestionsListContainer,
        ]}
      >
        <PortalWhileClosingView
          portalHostName='overlay-suggestion-list'
          portalName='autocomplete-suggestion-list'
        >
          <AutoCompleteSuggestionList />
        </PortalWhileClosingView>
      </Animated.View>
      <NotificationList
        bottomOffset={messageInputFloating ? messageInputHeight + 16 : undefined}
        filter={allowSendBeforeAttachmentsUpload ? excludeCanceledUploadNotifications : undefined}
      />
    </View>
  );
};

/**
 * Unfortunately, FlashList does not handle autoscrolling if the footer changes properly. Because
 * of that, we calculate this manually and autoscroll to the bottom if we're near the end. We only
 * do this if the typing indicator is about to be rendered for now. Later on we can rely on proper
 * layout calculations.
 */
const FlashListFooterTypingAdapter = ({
  enabled,
  children,
}: PropsWithChildren<{
  enabled: boolean;
}>) => {
  const api = useFlashListContext();
  const typingUsers = useTypingUsers();

  const typingUsersLengthRef = useRef<number>(typingUsers.length);

  useEffect(() => {
    const listApi = api?.getRef?.();

    if (!enabled || !listApi) {
      return;
    }

    const lastScrollOffset = listApi.getAbsoluteLastScrollOffset();
    const contentSize = listApi.getChildContainerDimensions();
    const windowSize = listApi.getWindowSize();

    const visibleLength = windowSize.height;
    const contentLength = contentSize.height + listApi.getFirstItemOffset();

    const isNearEnd = Math.ceil(lastScrollOffset + visibleLength) >= contentLength;

    if (listApi && typingUsersLengthRef.current === 0 && typingUsers.length > 0 && isNearEnd) {
      listApi.scrollToEnd({ animated: true });
    }

    typingUsersLengthRef.current = typingUsers.length;
  }, [enabled, api, typingUsers.length]);

  return children;
};

export type MessageFlashListProps = Partial<MessageFlashListPropsWithContext>;

/**
 * This is a @experimental component.
 * It is implemented using @shopify/flash-list package to optimize the performance of the MessageList component.
 * The implementation is experimental and is subject to change.
 * Please feel free to report any issues or suggestions.
 */
export const MessageFlashList = (props: MessageFlashListProps) => {
  const { closePicker, attachmentPickerStore } = useAttachmentPickerContext();
  const {
    channel,
    disabled,
    enableMessageGroupingByUser,
    hideStickyDateHeader,
    highlightedMessageId,
    isChannelActive,
    loadChannelAroundMessage,
    loading,
    maximumMessageLimit,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    hasPendingInitialTargetLoad,
    threadList,
  } = useChannelContext();
  const markRead = useMarkRead(channel);
  const { client } = useChatContext();
  const { disableTypingIndicator, FlatList, myMessageTheme, shouldShowUnreadUnderlay } =
    useMessagesContext();
  const {
    loadMore,
    loadMoreRecent,
    state: { loadingMore, loadingMoreRecent },
  } = useMessageListPagination({ channel });
  const { threadInstance } = useThreadContext();
  const { readEvents } = useOwnCapabilitiesContext();
  const { allowSendBeforeAttachmentsUpload, messageInputFloating, messageInputHeightStore } =
    useMessageInputContext();

  return (
    <MessageFlashListWithContext
      {...{
        allowSendBeforeAttachmentsUpload,
        attachmentPickerStore,
        channel,
        client,
        closePicker,
        disabled,
        disableTypingIndicator,
        enableMessageGroupingByUser,
        FlatList,
        hideStickyDateHeader,
        highlightedMessageId,
        isListActive: isChannelActive,
        loadChannelAroundMessage,
        loading,
        loadMore,
        loadMoreRecent,
        loadingMore,
        loadingMoreRecent,
        markRead,
        maximumMessageLimit,
        messageInputFloating,
        messageInputHeightStore,
        myMessageTheme,
        readEvents,
        reloadChannel,
        scrollToFirstUnreadThreshold,
        hasPendingInitialTargetLoad,
        shouldShowUnreadUnderlay,
        threadInstance,
        threadList,
      }}
      {...props}
      noGroupByUser={!enableMessageGroupingByUser || props.noGroupByUser}
    />
  );
};

const useStyles = () => {
  const {
    theme: {
      semantics,
      messageList: {
        container,
        contentContainer,
        listContainer,
        stickyHeaderContainer,
        scrollToBottomButtonContainer,
        unreadMessagesNotificationContainer,
      },
      messageComposer: {
        suggestionsListContainer: { container: suggestionListContainer },
      },
    },
  } = useTheme();

  const { backgroundCoreApp } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        suggestionsListContainer: {
          backgroundColor: 'transparent',
          position: 'absolute',
          width: '100%',
          ...suggestionListContainer,
        },
        container: {
          flex: 1,
          width: '100%',
          backgroundColor: backgroundCoreApp,
          ...container,
        },
        contentContainer: {
          /**
           * paddingBottom is set to 4 to account for the default date
           * header and inline indicator alignment. The top margin is 8
           * on the header but 4 on the inline date, this adjusts the spacing
           * to allow the "first" inline date to align with the date header.
           */
          paddingBottom: 4,
          ...contentContainer,
        },
        flex: { flex: 1, backgroundColor: backgroundCoreApp },
        listContainer: {
          flex: 1,
          width: '100%',
          ...listContainer,
        },
        scrollToBottomButtonContainer: {
          position: 'absolute',
          right: 16,
          ...scrollToBottomButtonContainer,
        },
        stickyHeaderContainer: {
          left: 0,
          position: 'absolute',
          right: 0,
          top: primitives.spacingMd,
          ...stickyHeaderContainer,
        },
        unreadMessagesNotificationContainer: {
          position: 'absolute',
          top: primitives.spacingMd,
          left: 0,
          right: 0,
          alignItems: 'center',
          ...unreadMessagesNotificationContainer,
        },
      }),
    [
      backgroundCoreApp,
      container,
      contentContainer,
      listContainer,
      scrollToBottomButtonContainer,
      stickyHeaderContainer,
      unreadMessagesNotificationContainer,
      suggestionListContainer,
    ],
  );
};
