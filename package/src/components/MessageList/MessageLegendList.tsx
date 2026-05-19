import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';

import Animated from 'react-native-reanimated';

import {
  LegendList,
  LegendListProps,
  LegendListRef,
  LegendListRenderItemProps,
  OnViewableItemsChangedInfo,
} from '@legendapp/list/react-native';
import debounce from 'lodash/debounce';

import type { Channel, Event, LocalMessage, MessageResponse } from 'stream-chat';

import { useMessageList } from './hooks/useMessageList';
import { useScrollToBottomAccessibilityAction } from './hooks/useScrollToBottomAccessibilityAction';
import { useShouldScrollToRecentOnNewOwnMessage } from './hooks/useShouldScrollToRecentOnNewOwnMessage';

import { InlineLoadingMoreIndicator } from './InlineLoadingMoreIndicator';
import { InlineLoadingMoreRecentIndicator } from './InlineLoadingMoreRecentIndicator';
import { InlineLoadingMoreRecentThreadIndicator } from './InlineLoadingMoreRecentThreadIndicator';

import {
  buildMessageListWithNeighbours,
  MessageListItemWithNeighbours,
} from './utils/buildMessageListWithNeighbours';

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
import { useDebugContext } from '../../contexts/debugContext/DebugContext';
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
import {
  PaginatedMessageListContextValue,
  usePaginatedMessageListContext,
} from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { mergeThemes, useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import { useStableCallback, useStateStore } from '../../hooks';
import { bumpOverlayLayoutRevision } from '../../state-store';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import { transitions } from '../../utils/animations/transitions';
import { useIncomingMessageAnnouncements } from '../Accessibility/hooks/useIncomingMessageAnnouncements';
import { MessageWrapper } from '../Message/MessageItemView/MessageWrapper';

const WAIT_FOR_SCROLL_TIMEOUT = 0;

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
    },
  } = useTheme();

  const { backgroundCoreApp } = semantics;

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          width: '100%',
          backgroundColor: backgroundCoreApp,
          ...container,
        },
        contentContainer: {
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
    ],
  );
};

const keyExtractor = (derivedItem: MessageListItemWithNeighbours) => {
  const { message: item } = derivedItem;
  if (item.id) {
    return item.id;
  }
  if (item.created_at) {
    return typeof item.created_at === 'string' ? item.created_at : item.created_at.toISOString();
  }
  return Date.now().toString();
};

const legendListViewabilityConfig: ViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 1,
};

/**
 * Coarse item-type classification. Even with `recycleItems: false`, LegendList uses the returned
 * type to bucket measured sizes (`getAverageItemSizes()` is keyed by type), so providing types
 * means newly virtualized rows get a much better initial size estimate and we avoid the
 * layout-thrash you'd otherwise see while fast-scrolling through unmeasured items.
 *
 * Mirrors `MessageFlashList`'s `getItemTypeInternal` so future work can be shared.
 */
const getItemTypeForMessage = (derivedItem: MessageListItemWithNeighbours): MessageItemTypeKey => {
  const message = derivedItem.message;
  if (message.type === 'regular') {
    if ((message.attachments?.length ?? 0) > 0) {
      return 'message-with-attachments';
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

type MessageItemTypeKey =
  | 'message-with-attachments'
  | 'message-with-poll'
  | 'message-with-quote'
  | 'message-with-shared-location'
  | 'message-with-text'
  | 'message-with-nothing'
  | 'deleted-message'
  | 'system-message'
  | 'generic-message';

/**
 * First-paint size hints in pixels. Bias is intentionally toward over-estimating: an oversized
 * placeholder mostly costs a little extra initial padding, whereas an undersized one triggers
 * scroll-position thrash as items measure-and-resize during fast scrolling. Once a few items
 * of each type have been measured LegendList replaces these with running averages, so these
 * numbers only have to be in the right ballpark.
 */
const ESTIMATED_ITEM_SIZE_BY_TYPE: Record<MessageItemTypeKey, number> = {
  'message-with-attachments': 260,
  'message-with-poll': 220,
  'message-with-quote': 140,
  'message-with-shared-location': 240,
  'message-with-text': 80,
  'message-with-nothing': 60,
  'deleted-message': 48,
  'system-message': 44,
  'generic-message': 80,
};

const DEFAULT_ESTIMATED_ITEM_SIZE = 80;

const getEstimatedItemSizeForMessage = (
  item: MessageListItemWithNeighbours,
  _index: number,
  type: string | undefined,
) => {
  const resolvedType =
    type !== undefined && type in ESTIMATED_ITEM_SIZE_BY_TYPE
      ? (type as MessageItemTypeKey)
      : getItemTypeForMessage(item);
  return ESTIMATED_ITEM_SIZE_BY_TYPE[resolvedType] ?? DEFAULT_ESTIMATED_ITEM_SIZE;
};

const hasReadLastMessage = (channel: Channel, userId: string) => {
  const latestMessageIdInChannel =
    channel.state.latestMessages[channel.state.latestMessages.length - 1]?.id;
  const lastReadMessageIdServer = channel.state.read[userId]?.last_read_message_id;
  return latestMessageIdInChannel === lastReadMessageIdServer;
};

const getPreviousLastMessage = (messages: LocalMessage[], newMessage?: MessageResponse) => {
  if (!newMessage) return;
  let previousLastMessage;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg?.id) break;
    if (msg.id !== newMessage.id) {
      previousLastMessage = msg;
      break;
    }
  }
  return previousLastMessage;
};

const messageInputHeightStoreSelector = (state: MessageInputHeightState) => ({
  height: state.height,
});

type MessageLegendListPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'closePicker' | 'attachmentPickerStore'
> &
  Pick<OwnCapabilitiesContextValue, 'readEvents'> &
  Pick<
    ChannelContextValue,
    | 'channel'
    | 'channelUnreadStateStore'
    | 'disabled'
    | 'hasPendingInitialTargetLoad'
    | 'hideStickyDateHeader'
    | 'loadChannelAroundMessage'
    | 'loading'
    | 'markRead'
    | 'reloadChannel'
    | 'scrollToFirstUnreadThreshold'
    | 'setChannelUnreadState'
    | 'setTargetedMessage'
    | 'targetedMessage'
    | 'threadList'
    | 'maximumMessageLimit'
  > &
  Pick<ChatContextValue, 'client'> &
  Pick<PaginatedMessageListContextValue, 'loadMore' | 'loadMoreRecent' | 'hasMore'> &
  Pick<
    MessagesContextValue,
    'disableTypingIndicator' | 'myMessageTheme' | 'shouldShowUnreadUnderlay'
  > &
  Pick<MessageInputContextValue, 'messageInputFloating' | 'messageInputHeightStore'> &
  Pick<
    ThreadContextValue,
    'loadMoreRecentThread' | 'loadMoreThread' | 'threadHasMore' | 'thread' | 'threadInstance'
  > & {
    /**
     * Besides existing (default) UX behavior of underlying LegendList of MessageLegendList component, if you want
     * to attach some additional props to underlying LegendList, you can add it to following prop.
     *
     * **NOTE** Don't use `additionalLegendListProps` to get access to ref of the list. Use `setFlatListRef` instead.
     */
    additionalLegendListProps?: Partial<LegendListProps<MessageListItemWithNeighbours>>;
    /**
     * UI component for footer of message list. By default message list will use `InlineLoadingMoreRecentIndicator`
     * plus the typing indicator as ListFooterComponent (rendered below the newest messages).
     */
    FooterComponent?: React.ComponentType;
    /**
     * UI component for header of message list. By default message list will use `InlineLoadingMoreIndicator`
     * as ListHeaderComponent (rendered above the oldest messages).
     */
    HeaderComponent?: React.ComponentType;
    /** Turn off grouping of messages by user */
    noGroupByUser?: boolean;
    onListScroll?: ScrollViewProps['onScroll'];
    /**
     * Handler to open the thread on message. This is callback for touch event for replies button.
     *
     * @param message A message object to open the thread upon.
     */
    onThreadSelect?: (message: ThreadContextValue['thread']) => void;
    /**
     * Use `setFlatListRef` to get access to the underlying LegendList ref.
     * The prop name is kept identical to `MessageList`/`MessageFlashList` for API parity, but the
     * value here is a `LegendListRef`.
     *
     * e.g.
     * ```js
     * <MessageLegendList
     *  setFlatListRef={(ref) => {
     *    // Use ref for your own good
     *  }}
     * />
     * ```
     */
    setFlatListRef?: (ref: LegendListRef | null) => void;
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

/**
 * The MessageLegendList component renders a list of messages using `@legendapp/list` (LegendList).
 *
 * Compared to `MessageList` (FlatList) and `MessageFlashList` (FlashList v2) it follows LegendList's
 * documented chat pattern: a non-inverted list with `alignItemsAtEnd` + `maintainScrollAtEnd` + an
 * opt-in `maintainVisibleContentPosition` to anchor visible content while older messages are prepended.
 *
 * It consumes the same contexts and provides the same feature surface (sticky date header,
 * scroll-to-bottom button, inline unread indicator, network down indicator, typing indicator,
 * pagination, targeted-message scroll, etc.) as `MessageList`.
 *
 * Recycling (`recycleItems`) is disabled in this initial version to avoid the kind of cell-blanking
 * and stateful-row issues that surface under aggressive virtualization. Enabling it requires a wider
 * audit of stateful row internals (audio progress, expanded quote state, etc.) and the right
 * `getItemType`/`useRecyclingState` plumbing.
 */
const MessageLegendListWithContext = (props: MessageLegendListPropsWithContext) => {
  const LoadingMoreRecentIndicator = props.threadList
    ? InlineLoadingMoreRecentThreadIndicator
    : InlineLoadingMoreRecentIndicator;
  const {
    additionalLegendListProps,
    attachmentPickerStore,
    channel,
    channelUnreadStateStore,
    client,
    closePicker,
    disabled,
    disableTypingIndicator,
    FooterComponent,
    hasPendingInitialTargetLoad,
    HeaderComponent = InlineLoadingMoreIndicator,
    hideStickyDateHeader,
    isLiveStreaming = false,
    loadChannelAroundMessage,
    loading,
    loadMore,
    loadMoreRecent,
    loadMoreRecentThread,
    loadMoreThread,
    markRead,
    maximumMessageLimit,
    messageInputFloating,
    messageInputHeightStore,
    myMessageTheme,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    readEvents,
    reloadChannel,
    setChannelUnreadState,
    setFlatListRef,
    setTargetedMessage,
    targetedMessage,
    thread,
    threadInstance,
    threadList = false,
    hasMore,
    threadHasMore,
  } = props;
  const {
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

  const [isUnreadNotificationOpen, setIsUnreadNotificationOpen] = useState<boolean>(false);
  const { theme } = useTheme();
  const styles = useStyles();
  const { height: messageInputHeight } = useStateStore(
    messageInputHeightStore.store,
    messageInputHeightStoreSelector,
  );

  useIncomingMessageAnnouncements({
    activeThreadId: thread?.id,
    channel,
    ownUserId: client.user?.id,
    threadList,
  });

  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

  const modifiedTheme = useMemo(
    () => mergeThemes({ style: myMessageTheme, theme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myMessageThemeString, theme],
  );

  /**
   * NOTE: rawMessageList changes only when messages array state changes.
   * processedMessageList changes on any state change. We pass `isFlashList: true` so the
   * hook returns the natural (non-inverted) ordering, with the newest message at the end.
   */
  const { processedMessageList, rawMessageList, viewabilityChangedCallback } = useMessageList({
    isFlashList: true,
    isLiveStreaming,
    threadList,
  });

  const previousDerivedItemsRef = useRef<Map<string, MessageListItemWithNeighbours>>(undefined);

  const processedMessageListWithNeighbors = useMemo(() => {
    if (!previousDerivedItemsRef.current) {
      previousDerivedItemsRef.current = new Map();
    }

    const { items, nextDerivedItems } = buildMessageListWithNeighbours(
      processedMessageList,
      previousDerivedItemsRef.current,
    );
    previousDerivedItemsRef.current = nextDerivedItems;

    return items;
  }, [processedMessageList]);

  const renderItem = useStableCallback(
    ({ item }: LegendListRenderItemProps<MessageListItemWithNeighbours>) => {
      const { message, previousMessage, nextMessage } = item;
      // `buildMessageListWithNeighbours` walks the data array linearly, so for our non-inverted
      // ordering `previousMessage` is OLDER and `nextMessage` is NEWER. The SDK's group-style
      // and date-separator helpers were written for the inverted `MessageList` convention, where
      // `previousMessage` is NEWER and `nextMessage` is OLDER. Swap when handing off so the same
      // logic produces matching UI (group "bottom" / `MessageFooter` lands on the oldest message
      // in the group, inline date separators sit at the row of the day-boundary message, etc.).
      return (
        <MessageWrapper
          message={message}
          previousMessage={nextMessage}
          nextMessage={previousMessage}
        />
      );
    },
  );

  const messageListLengthBeforeUpdate = useRef(0);
  const messageListLengthAfterUpdate = processedMessageList.length;

  /**
   * In non-inverted mode `rawMessageList[0]` is the OLDEST message in raw channel state.
   * It changes whenever the active message set changes (channel resync), which is exactly
   * what the topMessage-tracking logic wants to detect.
   */
  const topMessageBeforeUpdate = useRef<LocalMessage>(undefined);
  const latestNonCurrentMessageBeforeUpdateRef = useRef<LocalMessage>(undefined);
  const topMessageAfterUpdate: LocalMessage | undefined = rawMessageList[0];

  const shouldScrollToRecentOnNewOwnMessageRef = useShouldScrollToRecentOnNewOwnMessage(
    rawMessageList,
    client.userID,
  );

  // Starts disabled so we don't fight initial first-unread positioning; the channel-set effect
  // below flips it true once we've settled on the latest set.
  const [autoscrollToRecent, setAutoscrollToRecent] = useState(false);
  const didMountRef = useRef(false);

  const maintainVisibleContentPosition = useMemo(
    () =>
      ({
        // Anchor the visible item when older messages are prepended via onStartReached scroll.
        // Required because the LegendList 3.0 beta defaults `data` anchoring off.
        data: true,
        size: true,
      }) as const,
    [],
  );

  const maintainScrollAtEnd = useMemo(
    () =>
      ({
        animated: true,
        on: {
          // Auto-scroll to end on new messages only when we are following recent activity.
          dataChange: autoscrollToRecent,
          // Disabled: on Android each item-layout fire (e.g. image attachment decode, reaction
          // count grow) becomes a scroll-position adjustment, and during fast scroll a flood of
          // these fights the user's scroll velocity. `dataChange` alone covers new messages.
          itemLayout: false,
          // Disabled: container layout changes mostly come from keyboard / orientation, which
          // we don't want to trigger an autoscroll-to-end. Composer height is handled separately.
          layout: false,
        },
      }) as const,
    [autoscrollToRecent],
  );

  /**
   * We want to call onEndReached and onStartReached only once, per content length.
   * We keep track of calls to these functions per content length, with following trackers.
   */
  const onStartReachedTracker = useRef<Record<number, boolean>>({});
  const onEndReachedTracker = useRef<Record<number, boolean>>({});

  const onStartReachedInPromise = useRef<Promise<void> | null>(null);
  const onEndReachedInPromise = useRef<Promise<void> | null>(null);

  const legendListRef = useRef<LegendListRef | null>(null);

  const channelResyncScrollSet = useRef<boolean>(true);

  const scrollToDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onScrollEventTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const messageIdLastScrolledToRef = useRef<string>(undefined);
  const [hasMoved, setHasMoved] = useState(false);

  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);

  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date | undefined>();
  const stickyHeaderDateRef = useRef<Date | undefined>(undefined);

  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  // ref for channel to use in useEffect without triggering it on channel change
  const channelRef = useRef(channel);
  channelRef.current = channel;

  /**
   * In a non-inverted list, the topmost visible item appears first in `viewableItems`.
   * That is the OLDEST visible message — exactly what we want shown in the sticky date header.
   */
  const updateStickyHeaderDateIfNeeded = useStableCallback((viewableItems: ViewToken[]) => {
    if (!viewableItems.length) {
      return;
    }

    const topVisibleItem = viewableItems[0];
    const topVisibleMessage = topVisibleItem?.item?.message;

    if (!topVisibleMessage) {
      return;
    }

    // If there are no more older messages AND the topmost visible row is the oldest message
    // in the list, we are at the absolute start — hide the sticky header.
    if (
      !channel.state.messagePagination.hasPrev &&
      processedMessageList[0]?.id === topVisibleMessage.id
    ) {
      setStickyHeaderDate(undefined);
      return;
    }

    const isMessageTypeDeleted = topVisibleMessage.type === 'deleted';

    if (
      topVisibleMessage.created_at &&
      !isMessageTypeDeleted &&
      typeof topVisibleMessage.created_at !== 'string' &&
      topVisibleMessage.created_at.toDateString() !== stickyHeaderDateRef.current?.toDateString()
    ) {
      stickyHeaderDateRef.current = topVisibleMessage.created_at;
      setStickyHeaderDate(topVisibleMessage.created_at);
    }
  });

  /**
   * Show/hide the floating "unread messages" notification based on whether the last-read
   * marker is still scrolled past the visible viewport. Non-inverted variant of
   * `MessageList`'s implementation.
   */
  const updateStickyUnreadIndicator = useStableCallback((viewableItems: ViewToken[]) => {
    const channelUnreadState = channelUnreadStateStore.channelUnreadState;
    const lastReadMessageId = channelUnreadState?.last_read_message_id;
    const lastReadMessageVisible = viewableItems.some(
      (item) => item.item.message.id === lastReadMessageId,
    );

    if (
      !viewableItems.length ||
      !readEvents ||
      lastReadMessageVisible ||
      attachmentPickerStore.state.getLatestValue().selectedPicker === 'images'
    ) {
      setIsUnreadNotificationOpen(false);
      return;
    }

    // In non-inverted mode, the bottom-most visible row is at the end of `viewableItems` (the
    // "lastItem" semantics used by `MessageList` inverted match what's at index 0 there).
    const bottomVisibleItem = viewableItems[viewableItems.length - 1];

    if (!bottomVisibleItem) {
      return;
    }

    const bottomVisibleMessage = bottomVisibleItem.item.message;
    const bottomVisibleCreatedAt = bottomVisibleMessage?.created_at;

    if (!bottomVisibleCreatedAt) {
      return;
    }

    const unreadIndicatorDate = channelUnreadState?.last_read?.getTime();
    const bottomVisibleDate =
      typeof bottomVisibleCreatedAt === 'string'
        ? new Date(bottomVisibleCreatedAt).getTime()
        : bottomVisibleCreatedAt.getTime();

    // If there are no more newer messages AND the bottom-most visible row is the newest
    // message in the list, the user is caught up — hide the notification.
    if (
      !channel.state.messagePagination.hasNext &&
      processedMessageList[processedMessageList.length - 1]?.id === bottomVisibleMessage.id
    ) {
      setIsUnreadNotificationOpen(false);
      return;
    }

    if (
      viewableItems.length === 1 &&
      channel.countUnread() === 0 &&
      bottomVisibleMessage.user.id === client.userID
    ) {
      setIsUnreadNotificationOpen(false);
      return;
    }
    if (unreadIndicatorDate && bottomVisibleDate > unreadIndicatorDate) {
      setIsUnreadNotificationOpen(true);
    } else {
      setIsUnreadNotificationOpen(false);
    }
  });

  /**
   * Like FlatList, LegendList doesn't accept a changeable function for `onViewableItemsChanged`.
   * Thus useRef + a stable wrapper.
   */
  const unstableOnViewableItemsChanged = (
    info: OnViewableItemsChangedInfo<MessageListItemWithNeighbours>,
  ) => {
    const viewableItems = info?.viewableItems;
    if (!viewableItems) {
      return;
    }
    // The viewability callback used by the SDK is shaped against RN's ViewToken; LegendList's
    // ViewToken is a structural superset (adds `containerId`), so a cast keeps callers happy.
    viewabilityChangedCallback({
      inverted: false,
      viewableItems: viewableItems as unknown as ViewToken[],
    });

    if (!hideStickyDateHeader) {
      updateStickyHeaderDateIfNeeded(viewableItems as unknown as ViewToken[]);
    }
    updateStickyUnreadIndicator(viewableItems as unknown as ViewToken[]);
  };

  const onViewableItemsChanged = useRef(unstableOnViewableItemsChanged);
  onViewableItemsChanged.current = unstableOnViewableItemsChanged;

  const stableOnViewableItemsChanged = useCallback(
    (info: OnViewableItemsChangedInfo<MessageListItemWithNeighbours>) => {
      onViewableItemsChanged.current(info);
    },
    [],
  );

  const resetPaginationTrackersRef = useRef(() => {
    onStartReachedTracker.current = {};
    onEndReachedTracker.current = {};
  });

  useEffect(() => {
    if (disabled) {
      setScrollToBottomButtonVisible(false);
    }
  }, [disabled]);

  /**
   * Mark the channel as read when the user is scrolled to the bottom of the message list,
   * and otherwise locally bump unread state for incoming messages.
   */
  useEffect(() => {
    const shouldMarkRead = () => {
      const channelUnreadState = channelUnreadStateStore.channelUnreadState;
      return (
        !channelUnreadState?.first_unread_message_id &&
        !scrollToBottomButtonVisible &&
        client.user?.id &&
        !hasReadLastMessage(channel, client.user?.id)
      );
    };

    const handleEvent = async (event: Event) => {
      const mainChannelUpdated = !event.message?.parent_id || event.message?.show_in_channel;
      const isMyOwnMessage = event.message?.user?.id === client.user?.id;
      const channelUnreadState = channelUnreadStateStore.channelUnreadState;
      if (
        (scrollToBottomButtonVisible || channelUnreadState?.first_unread_message_id) &&
        !isMyOwnMessage
      ) {
        const previousUnreadCount = channelUnreadState?.unread_messages ?? 0;
        const previousLastMessage = getPreviousLastMessage(channel.state.messages, event.message);
        setChannelUnreadState({
          ...channelUnreadState,
          last_read:
            channelUnreadState?.last_read ??
            (previousUnreadCount === 0 && previousLastMessage?.created_at
              ? new Date(previousLastMessage.created_at)
              : new Date(0)),
          unread_messages: previousUnreadCount + 1,
        });
      } else if (mainChannelUpdated && shouldMarkRead()) {
        await markRead();
      }
    };

    const listener: ReturnType<typeof channel.on> = channel.on('message.new', handleEvent);

    return () => {
      listener?.unsubscribe();
    };
  }, [
    channel,
    channelUnreadStateStore,
    client.user?.id,
    markRead,
    scrollToBottomButtonVisible,
    setChannelUnreadState,
    threadList,
  ]);

  useEffect(() => {
    /**
     * Condition to check if a message is removed from the MessageList (giphy cancel,
     * delete-with-visibility-never, etc.). When that happens we re-pin to the bottom.
     */
    const isMessageRemovedFromMessageList =
      messageListLengthAfterUpdate < messageListLengthBeforeUpdate.current;

    const scrollToBottomIfNeeded = () => {
      if (!client || !channel || rawMessageList.length === 0) {
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
          legendListRef.current?.scrollToEnd({ animated: false });
        }, WAIT_FOR_SCROLL_TIMEOUT);

        setTimeout(() => {
          channelResyncScrollSet.current = true;
          if (channel.countUnread() > 0) {
            markRead();
          }
        }, 500);
      }
    };

    if (threadList || isMessageRemovedFromMessageList) {
      if (maximumMessageLimit) {
        resetPaginationTrackersRef.current();
      } else {
        scrollToBottomIfNeeded();
      }
    }

    messageListLengthBeforeUpdate.current = messageListLengthAfterUpdate;
    topMessageBeforeUpdate.current = topMessageAfterUpdate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadList, messageListLengthAfterUpdate, topMessageAfterUpdate?.id, maximumMessageLimit]);

  useEffect(() => {
    if (threadList) {
      setAutoscrollToRecent(true);
      return;
    }

    if (!processedMessageList.length) {
      return;
    }

    const notLatestSet = channel.state.messages !== channel.state.latestMessages;
    if (notLatestSet) {
      latestNonCurrentMessageBeforeUpdateRef.current =
        channel.state.latestMessages[channel.state.latestMessages.length - 1];
      setAutoscrollToRecent(false);
      setScrollToBottomButtonVisible(true);
      return;
    }
    const latestNonCurrentMessageBeforeUpdate = latestNonCurrentMessageBeforeUpdateRef.current;
    latestNonCurrentMessageBeforeUpdateRef.current = undefined;

    // In non-inverted ordering the newest message lives at the end of the array.
    const latestCurrentMessageAfterUpdate = processedMessageList[processedMessageList.length - 1];
    if (!latestCurrentMessageAfterUpdate) {
      setAutoscrollToRecent(true);
      return;
    }
    const didMergeMessageSetsWithNoUpdates =
      latestNonCurrentMessageBeforeUpdate?.id === latestCurrentMessageAfterUpdate.id;

    const shouldForceScrollToRecent =
      !didMergeMessageSetsWithNoUpdates ||
      processedMessageList.length - messageListLengthBeforeUpdate.current > 0;

    if ((maximumMessageLimit && shouldForceScrollToRecent) || !maximumMessageLimit) {
      setAutoscrollToRecent(shouldForceScrollToRecent);
    }

    if (!didMergeMessageSetsWithNoUpdates) {
      const shouldScrollToRecentOnNewOwnMessage = shouldScrollToRecentOnNewOwnMessageRef.current();
      if (shouldScrollToRecentOnNewOwnMessage) {
        setTimeout(() => {
          legendListRef.current?.scrollToEnd({ animated: true });
        }, WAIT_FOR_SCROLL_TIMEOUT);
      }
    }
  }, [
    channel,
    threadList,
    processedMessageList,
    shouldScrollToRecentOnNewOwnMessageRef,
    maximumMessageLimit,
  ]);

  /**
   * When `autoscrollToRecent` flips to `true` AFTER the first render (e.g., the user returned to
   * the latest message set via the scroll-to-bottom FAB), explicitly scroll to the end. We guard
   * against running on initial mount and while a targeted initial scroll is pending; that race
   * is what made first-unread positioning unreliable in `MessageFlashList` (see
   * `MESSAGE_FLASHLIST_SCROLL_HANDOVER.md`).
   */
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (!autoscrollToRecent || !legendListRef.current) {
      return;
    }

    if (targetedMessage || hasPendingInitialTargetLoad?.()) {
      return;
    }

    legendListRef.current.scrollToEnd({ animated: true });
  }, [autoscrollToRecent, hasPendingInitialTargetLoad, targetedMessage]);

  /**
   * Animated scroll-to-index that prefers a measured offset over LegendList's animated
   * `scrollToIndex` staging path. Mirrors the working fix identified in
   * `MESSAGE_FLASHLIST_SCROLL_HANDOVER.md`: when item layout is known, compute a viewport-centered
   * offset directly; otherwise fall back to `scrollToIndex` (which retries internally).
   */
  const scrollToMessageIndex = useStableCallback(
    async (index: number, options?: { animated?: boolean }) => {
      const list = legendListRef.current;
      if (!list || index < 0) {
        return;
      }
      const animated = options?.animated ?? true;
      try {
        const state = list.getState();
        const itemSize = state.sizeAtIndex(index);
        const position = state.positionAtIndex(index);
        const viewportLength = state.scrollLength;

        if (
          Number.isFinite(position) &&
          itemSize > 0 &&
          viewportLength > 0 &&
          state.contentLength > 0
        ) {
          const centeredOffset = position - (viewportLength - itemSize) * 0.5;
          const maxOffset = Math.max(0, state.contentLength - viewportLength);
          const offset = Math.min(Math.max(centeredOffset, 0), maxOffset);
          await list.scrollToOffset({ animated, offset });
          return;
        }

        await list.scrollToIndex({ animated, index, viewPosition: 0.5 });
      } catch (e) {
        if (__DEV__) {
          console.warn('MessageLegendList: scrollToMessageIndex failed', e);
        }
      }
    },
  );

  const goToMessage = useStableCallback(async (messageId: string) => {
    const indexOfParentInMessageList = processedMessageList.findIndex(
      (message) => message?.id === messageId,
    );
    try {
      if (indexOfParentInMessageList === -1) {
        await loadChannelAroundMessage({ messageId });
        return;
      } else {
        if (!legendListRef.current) {
          return;
        }
        messageIdLastScrolledToRef.current = messageId;
        setTargetedMessage(messageId);
        await scrollToMessageIndex(indexOfParentInMessageList, { animated: true });
        return;
      }
    } catch (e) {
      console.warn('Error while scrolling to message', e);
    }
  });

  /**
   * Targeted-message scroll effect — fires whenever `targetedMessage` changes. If the message
   * isn't in the loaded set we ask the channel to load around it; otherwise we scroll to it.
   */
  useEffect(() => {
    if (!targetedMessage) {
      return;
    }
    scrollToDebounceTimeoutRef.current = setTimeout(async () => {
      const indexOfParentInMessageList = processedMessageList.findIndex(
        (message) => message?.id === targetedMessage,
      );

      if (indexOfParentInMessageList === -1) {
        await loadChannelAroundMessage({ messageId: targetedMessage, setTargetedMessage });
      } else {
        if (!legendListRef.current) {
          return;
        }
        clearTimeout(scrollToDebounceTimeoutRef.current);
        await scrollToMessageIndex(indexOfParentInMessageList, { animated: true });
        setTargetedMessage(undefined);
      }
    }, WAIT_FOR_SCROLL_TIMEOUT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetedMessage]);

  const setNativeScrollability = useStableCallback((value: boolean) => {
    // LegendList doesn't expose `setNativeProps` for scrollEnabled, so we toggle the prop.
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
   * Manual scroll-position pagination, mirroring the rationale in `MessageList.tsx`:
   *  - keep a fixed pixel offset (100px) so triggers fire close to the edges
   *  - guarantee a single fire per content length
   *  - serialize start/end calls so they don't fight each other
   *
   * Non-inverted semantics:
   *  - top of viewport (offset < 100) → older messages → `loadMore`
   *  - bottom of viewport → newer messages → `loadMoreRecent`
   */
  const maybeCallOnStartReached = useStableCallback(async () => {
    // "Start" of message list data = newer messages (load more recent)
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
      setTimeout(() => {
        onStartReachedTracker.current = {};
      }, 2000);
    };

    if (onEndReachedInPromise.current) {
      await onEndReachedInPromise.current;
    }
    onStartReachedInPromise.current = (
      threadList && !!threadInstance && loadMoreRecentThread
        ? loadMoreRecentThread({})
        : loadMoreRecent()
    )
      .then(callback)
      .catch(onError);
  });

  const maybeCallOnEndReached = useStableCallback(async () => {
    // "End" of message list data = older messages (load more)
    const shouldQuery = (threadList && threadHasMore) || (!threadList && hasMore);
    if (
      (processedMessageList?.length && onEndReachedTracker.current[processedMessageList.length]) ||
      !shouldQuery
    ) {
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
      setTimeout(() => {
        onEndReachedTracker.current = {};
      }, 2000);
    };

    if (onStartReachedInPromise.current) {
      await onStartReachedInPromise.current;
    }
    onEndReachedInPromise.current = (threadList ? loadMoreThread() : loadMore())
      .then(callback)
      .catch(onError);
  });

  const onUserScrollEvent: NonNullable<ScrollViewProps['onScroll']> = useStableCallback((event) => {
    const nativeEvent = event.nativeEvent;
    clearTimeout(onScrollEventTimeoutRef.current);
    const offset = nativeEvent.contentOffset.y;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;
    if (!channel || !channelResyncScrollSet.current) {
      return;
    }

    // Non-inverted: scrolling near the TOP means we want OLDER messages (loadMore = onEndReached
    // in our internal naming, preserved for parity with MessageList).
    const isScrollNearTop = offset < 100;
    const isScrollNearBottom = contentLength - visibleLength - offset < 100;

    if (isScrollNearTop) {
      maybeCallOnEndReached();
    }

    if (isScrollNearBottom) {
      maybeCallOnStartReached();
    }
  });

  const handleScroll: ScrollViewProps['onScroll'] = useStableCallback((event) => {
    const messageListHasMessages = processedMessageList.length > 0;
    const nativeEvent = event.nativeEvent;
    const offset = nativeEvent.contentOffset.y;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;

    const isScrollAtBottom = contentLength - visibleLength - offset <= messageInputHeight;

    const notLatestSet = channel.state.messages !== channel.state.latestMessages;

    const showScrollToBottomButton =
      messageListHasMessages && ((!threadList && notLatestSet) || !isScrollAtBottom);

    setScrollToBottomButtonVisible(showScrollToBottomButton);

    if (onListScroll) {
      onListScroll(event);
    }
  });

  const goToNewMessages = useStableCallback(async () => {
    const isNotLatestSet = channel.state.messages !== channel.state.latestMessages;

    if (isNotLatestSet) {
      resetPaginationTrackersRef.current();
      await reloadChannel();
    } else if (legendListRef.current) {
      await legendListRef.current.scrollToEnd({ animated: true });
    }

    setScrollToBottomButtonVisible(false);
    await markRead({
      updateChannelUnreadState: false,
    });
  });

  const scrollToBottomUnreadCount =
    scrollToBottomButtonVisible && !threadList ? channel?.countUnread() : undefined;
  const {
    accessibilityActions: messageListAccessibilityActions,
    onAccessibilityAction: messageListOnAccessibilityAction,
  } = useScrollToBottomAccessibilityAction({
    accessibilityActions: additionalLegendListProps?.accessibilityActions,
    onAccessibilityAction: additionalLegendListProps?.onAccessibilityAction,
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

  const refCallback = useStableCallback((ref: LegendListRef | null) => {
    legendListRef.current = ref;
    if (setFlatListRef) {
      setFlatListRef(ref);
    }
  });

  const onUnreadNotificationClose = useStableCallback(async () => {
    await markRead();
    setIsUnreadNotificationOpen(false);
  });

  const debugRef = useDebugContext();
  const isDebugModeEnabled = __DEV__ && debugRef && debugRef.current;

  if (isDebugModeEnabled) {
    if (debugRef.current.setEventType) {
      debugRef.current.setEventType('send');
    }
    if (debugRef.current.setSendEventParams) {
      debugRef.current.setSendEventParams({
        action: thread ? 'ThreadList' : 'Messages',
        data: processedMessageList,
      });
    }
  }

  // Strip style/contentContainerStyle so we can compose them with our own.
  let additionalLegendListPropsExcludingStyle:
    | Omit<NonNullable<typeof additionalLegendListProps>, 'style' | 'contentContainerStyle'>
    | undefined;

  if (additionalLegendListProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentContainerStyle, style, ...rest } = additionalLegendListProps;
    additionalLegendListPropsExcludingStyle = rest;
  }

  const legendListStyle = useMemo(
    () => [styles.listContainer, additionalLegendListProps?.style],
    [additionalLegendListProps?.style, styles.listContainer],
  );

  const legendListContentContainerStyle = useMemo(
    () => [
      styles.contentContainer,
      { paddingBottom: messageInputFloating ? messageInputHeight : 0 },
      additionalLegendListProps?.contentContainerStyle,
    ],
    [
      additionalLegendListProps?.contentContainerStyle,
      messageInputFloating,
      messageInputHeight,
      styles.contentContainer,
    ],
  );

  const viewportHeightRef = useRef<number>(undefined);

  /**
   * If the current number of messages doesn't fill the viewport, keep loading older messages
   * until it does. Same prefill heuristic as `MessageList`.
   */
  const debouncedPrefillMessages = useMemo(
    () =>
      debounce(
        (viewportHeight: number, contentHeight: number) => {
          if (viewportHeight >= contentHeight) {
            maybeCallOnEndReached();
          }
        },
        500,
        { leading: false, trailing: true },
      ),
    [maybeCallOnEndReached],
  );

  const onContentSizeChange = useStableCallback((width: number, height: number) => {
    additionalLegendListProps?.onContentSizeChange?.(width, height);
    debouncedPrefillMessages(viewportHeightRef.current ?? 0, height);
  });

  const onLayout = useStableCallback((event: LayoutChangeEvent) => {
    additionalLegendListProps?.onLayout?.(event);
    const nextViewportHeight = event.nativeEvent.layout.height;
    if (viewportHeightRef.current !== nextViewportHeight) {
      const previousViewportHeight = viewportHeightRef.current ?? nextViewportHeight;
      const closeCorrectionDeltaY = nextViewportHeight - previousViewportHeight;
      bumpOverlayLayoutRevision(closeCorrectionDeltaY);
    }
    viewportHeightRef.current = nextViewportHeight;
  });

  /**
   * Non-inverted layout:
   *  - ListHeaderComponent renders above the OLDEST messages → loading-older indicator
   *  - ListFooterComponent renders below the NEWEST messages → loading-newer indicator + typing
   */
  const ListHeaderComponent = useMemo(() => HeaderComponent, [HeaderComponent]);

  const ListFooterComponent = useCallback(() => {
    if (FooterComponent) {
      return <FooterComponent />;
    }

    return (
      <>
        <LoadingMoreRecentIndicator />
        {!disableTypingIndicator && TypingIndicator && (
          <TypingIndicatorContainer>
            <TypingIndicator />
          </TypingIndicatorContainer>
        )}
      </>
    );
  }, [
    FooterComponent,
    LoadingMoreRecentIndicator,
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

  return (
    <View style={styles.container} testID='message-flat-list-wrapper'>
      {processedMessageList.length === 0 && !thread ? (
        <View style={styles.flex} testID='empty-state'>
          {EmptyStateIndicator ? <EmptyStateIndicator listType='message' /> : null}
        </View>
      ) : (
        <MessageListItemProvider value={messageListItemContextValue}>
          <LegendList
            alignItemsAtEnd
            contentContainerStyle={legendListContentContainerStyle}
            data={processedMessageListWithNeighbors}
            drawDistance={500}
            estimatedItemSize={DEFAULT_ESTIMATED_ITEM_SIZE}
            extraData={disabled}
            getEstimatedItemSize={getEstimatedItemSizeForMessage}
            getItemType={getItemTypeForMessage}
            keyboardShouldPersistTaps='handled'
            keyExtractor={keyExtractor}
            ListFooterComponent={ListFooterComponent}
            ListHeaderComponent={ListHeaderComponent}
            maintainScrollAtEnd={maintainScrollAtEnd}
            maintainScrollAtEndThreshold={isLiveStreaming ? 0.25 : 0.1}
            maintainVisibleContentPosition={maintainVisibleContentPosition}
            onContentSizeChange={onContentSizeChange}
            onLayout={onLayout}
            onMomentumScrollEnd={onUserScrollEvent}
            onScroll={handleScroll}
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            onTouchEnd={dismissImagePicker}
            onViewableItemsChanged={stableOnViewableItemsChanged}
            recycleItems
            ref={refCallback}
            renderItem={renderItem}
            scrollEnabled={scrollEnabled}
            scrollEventThrottle={isLiveStreaming ? 16 : 32}
            showsVerticalScrollIndicator={false}
            style={legendListStyle}
            testID='message-legend-list'
            viewabilityConfig={legendListViewabilityConfig}
            {...additionalLegendListPropsExcludingStyle}
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
      {scrollToBottomButtonVisible ? (
        <Animated.View
          layout={transitions.layout200}
          style={[
            {
              bottom: messageInputFloating
                ? messageInputHeight + primitives.spacingMd + 16
                : primitives.spacingMd,
            },
            styles.scrollToBottomButtonContainer,
          ]}
        >
          <ScrollToBottomButton
            onPress={goToNewMessages}
            showNotification={scrollToBottomButtonVisible}
            unreadCount={scrollToBottomUnreadCount}
          />
        </Animated.View>
      ) : null}

      <NetworkDownIndicator />
      {isUnreadNotificationOpen && !threadList ? (
        <View style={styles.unreadMessagesNotificationContainer}>
          <UnreadMessagesNotification
            onCloseHandler={onUnreadNotificationClose}
            channelUnreadStateStore={channelUnreadStateStore}
          />
        </View>
      ) : null}
      <NotificationList bottomOffset={messageInputFloating ? messageInputHeight + 16 : undefined} />
    </View>
  );
};

export type MessageLegendListProps = Partial<MessageLegendListPropsWithContext>;

/**
 * @experimental MessageLegendList is implemented using `@legendapp/list` (LegendList) to optimise
 * the performance of message rendering. The implementation follows LegendList's documented chat
 * pattern (non-inverted with `alignItemsAtEnd` + `maintainScrollAtEnd`) and matches `MessageList`'s
 * feature surface. It is experimental and subject to change.
 */
export const MessageLegendList = (props: MessageLegendListProps) => {
  const { closePicker, attachmentPickerStore } = useAttachmentPickerContext();
  const {
    channel,
    channelUnreadStateStore,
    disabled,
    enableMessageGroupingByUser,
    hasPendingInitialTargetLoad,
    hideStickyDateHeader,
    loadChannelAroundMessage,
    loading,
    maximumMessageLimit,
    markRead,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    setChannelUnreadState,
    setTargetedMessage,
    targetedMessage,
    threadList,
  } = useChannelContext();
  const { client } = useChatContext();
  const { readEvents } = useOwnCapabilitiesContext();
  const { disableTypingIndicator, myMessageTheme, shouldShowUnreadUnderlay } = useMessagesContext();
  const { messageInputFloating, messageInputHeightStore } = useMessageInputContext();
  const { loadMore, loadMoreRecent, hasMore } = usePaginatedMessageListContext();
  const { loadMoreRecentThread, loadMoreThread, threadHasMore, thread, threadInstance } =
    useThreadContext();

  return (
    <MessageLegendListWithContext
      {...{
        attachmentPickerStore,
        channel,
        channelUnreadStateStore,
        client,
        closePicker,
        disabled,
        disableTypingIndicator,
        hasMore,
        hasPendingInitialTargetLoad,
        hideStickyDateHeader,
        loadChannelAroundMessage,
        loading,
        loadMore,
        loadMoreRecent,
        loadMoreRecentThread,
        loadMoreThread,
        markRead,
        maximumMessageLimit,
        messageInputFloating,
        messageInputHeightStore,
        myMessageTheme,
        readEvents,
        reloadChannel,
        scrollToFirstUnreadThreshold,
        setChannelUnreadState,
        setTargetedMessage,
        shouldShowUnreadUnderlay,
        targetedMessage,
        thread,
        threadHasMore,
        threadInstance,
        threadList,
      }}
      {...props}
      noGroupByUser={!enableMessageGroupingByUser || props.noGroupByUser}
    />
  );
};
