import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  FlatList as FlatListType,
  LayoutChangeEvent,
  ScrollViewProps,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';

import Animated from 'react-native-reanimated';

import debounce from 'lodash/debounce';

import type { LocalMessage } from 'stream-chat';

import { useMarkRead } from './hooks/useMarkRead';
import { useMessageList } from './hooks/useMessageList';
import { useMessageListFocus } from './hooks/useMessageListFocus';
import { useMessageListLiveState } from './hooks/useMessageListLiveState';
import { useMessageListPagination } from './hooks/useMessageListPagination';
import { useOwnUnreadCount } from './hooks/useOwnUnreadCount';
import { useScrollToBottomAccessibilityAction } from './hooks/useScrollToBottomAccessibilityAction';
import { useShouldScrollToRecentOnNewOwnMessage } from './hooks/useShouldScrollToRecentOnNewOwnMessage';
import { useStickyHeaderDate } from './hooks/useStickyHeaderDate';
import { useUnreadNotificationVisibility } from './hooks/useUnreadNotificationVisibility';

import { InlineLoadingMoreIndicator } from './InlineLoadingMoreIndicator';
import { InlineLoadingMoreRecentIndicator } from './InlineLoadingMoreRecentIndicator';

import {
  buildMessageListWithNeighbours,
  getMessageListItemCacheKey,
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

import { usePendingUploadsEnabled } from '../../contexts/messageInputContext/hooks/usePendingUploadsEnabled';
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

import { useStableCallback } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { bumpOverlayLayoutRevision, useHasActiveId } from '../../state-store';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import type { ViewabilityConfig, ViewToken } from '../../types/react-native-compat';
import { transitions } from '../../utils/animations/transitions';
import { useIncomingMessageAnnouncements } from '../Accessibility/hooks/useIncomingMessageAnnouncements';
import { MarkReadFunctionOptions } from '../Channel/Channel';
import { MessageWrapper } from '../Message/MessageItemView/MessageWrapper';
import { excludeCanceledUploadNotifications } from '../Notifications/notificationFilters';
import { PortalWhileClosingView } from '../UIComponents';

// This is just to make sure that the scrolling happens in a different task queue.
// TODO: Think if we really need this and strive to remove it if we can.
const WAIT_FOR_SCROLL_TIMEOUT = 0;
const MAX_RETRIES_AFTER_SCROLL_FAILURE = 10;

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

// Delegates to the neighbour-cache key so the render key and the cache key cannot drift apart.
const keyExtractor = (derivedItem: MessageListItemWithNeighbours, index: number) =>
  getMessageListItemCacheKey(derivedItem.message, index);

const flatListViewabilityConfig: ViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 1,
};

type MessageListPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'closePicker' | 'attachmentPickerStore'
> &
  Pick<OwnCapabilitiesContextValue, 'readEvents'> &
  Pick<ChannelContextValue, 'channel' | 'disabled' | 'hideStickyDateHeader' | 'threadList'> &
  Pick<ChatContextValue, 'client'> & {
    markRead: (options?: MarkReadFunctionOptions) => void;
  } & Pick<MessagesContextValue, 'disableTypingIndicator' | 'FlatList' | 'myMessageTheme'> &
  Pick<MessageInputContextValue, 'messageInputFloating' | 'messageInputHeightStore'> &
  Pick<ThreadContextValue, 'threadInstance'> & {
    /**
     * Whether the composer lets a message be sent while its attachments are still uploading
     * (`messageComposer.attachments.pendingUploadsEnabled`). Read from the composer by default.
     */
    pendingUploadsEnabled: boolean;
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
    additionalFlatListProps?: Partial<FlatListProps<MessageListItemWithNeighbours>>;
    /**
     * UI component for footer of message list. By default message list will use `InlineLoadingMoreIndicator`
     * as FooterComponent. If you want to implement your own inline loading indicator, you can access `loadingMore`
     * from props.
     *
     * This is a [ListHeaderComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header by default if inverted is true or defaulted
     */
    FooterComponent?: React.ComponentType<{ loadingMore?: boolean }>;
    /**
     * UI component for header of message list. By default message list will use `InlineLoadingMoreRecentIndicator`
     * as HeaderComponent. If you want to implement your own inline loading indicator, you can access `loadingMoreRecent`
     * from context.
     *
     * This is a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header if inverted is false
     */
    HeaderComponent?: React.ComponentType;
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
    setFlatListRef?: (ref: FlatListType<MessageListItemWithNeighbours> | null) => void;
    /**
     * If true, the message list will be used in a live-streaming scenario.
     * This flag is used to make sure that the auto scroll behaves well, if multiple messages are received.
     *
     * This flag is experimental and is subject to change. Please test thoroughly before using it.
     *
     * @experimental
     */
    isLiveStreaming?: boolean;
    animateLayout?: boolean;
  };

const messageInputHeightStoreSelector = (state: MessageInputHeightState) => ({
  height: state.height,
});

/**
 * The message list component renders a list of messages. It consumes the following contexts:
 *
 * [ChannelContext](https://getstream.io/chat/docs/sdk/reactnative/contexts/channel-context/)
 * [ChatContext](https://getstream.io/chat/docs/sdk/reactnative/contexts/chat-context/)
 * [MessagesContext](https://getstream.io/chat/docs/sdk/reactnative/contexts/messages-context/)
 * [ThreadContext](https://getstream.io/chat/docs/sdk/reactnative/contexts/thread-context/)
 * [TranslationContext](https://getstream.io/chat/docs/sdk/reactnative/contexts/translation-context/)
 */
const MessageListWithContext = (props: MessageListPropsWithContext) => {
  const {
    animateLayout = true,
    attachmentPickerStore,
    additionalFlatListProps,
    channel,
    client,
    closePicker,
    disabled,
    disableTypingIndicator,
    FlatList,
    FooterComponent = InlineLoadingMoreIndicator,
    HeaderComponent,
    hideStickyDateHeader,
    inverted = true,
    isLiveStreaming = false,
    markRead,
    messageInputFloating,
    messageInputHeightStore,
    myMessageTheme,
    pendingUploadsEnabled,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    readEvents,
    setFlatListRef,
    threadInstance,
    threadList = false,
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
    AutoCompleteSuggestionList,
  } = useComponentsContext();
  const { theme } = useTheme();
  const styles = useStyles();
  const { height: messageInputHeight } = useStateStore(
    messageInputHeightStore.store,
    messageInputHeightStoreSelector,
  );
  const paginator = threadList ? threadInstance?.messagePaginator : channel.messagePaginator;

  useIncomingMessageAnnouncements({
    activeThreadId: threadInstance?.id,
    channel,
    ownUserId: client.user?.id,
    threadList,
  });

  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);
  const scheme = useColorScheme();

  const modifiedTheme = useMemo(
    () => mergeThemes({ scheme, style: myMessageTheme, theme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myMessageThemeString, scheme, theme],
  );

  const { maxLoadedItems, processedMessageList, rawMessageList, viewabilityChangedCallback } =
    useMessageList({ isLiveStreaming, paginator });
  const { loading, loadingMore, loadingMoreRecent, loadMore, loadMoreRecent } =
    useMessageListPagination(paginator);
  const { focusedMessageId, focusToken, goToMessage } = useMessageListFocus(paginator);
  const reportViewableMessages = useMessageListLiveState({
    channel,
    markRead,
    paginator,
    threadList,
    userId: client.user?.id,
  });
  const { stickyHeaderDate, updateStickyHeaderDate } = useStickyHeaderDate();
  const { isUnreadNotificationOpen, onUnreadNotificationClose, updateUnreadNotification } =
    useUnreadNotificationVisibility({
      attachmentPickerStore,
      channel,
      markRead,
      readEvents,
      userId: client.userID,
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

  const renderItem = useStableCallback(({ item }: { item: MessageListItemWithNeighbours }) => {
    const { message, previousMessage, nextMessage } = item;
    return (
      <MessageWrapper
        message={message}
        previousMessage={previousMessage}
        nextMessage={nextMessage}
      />
    );
  });

  const latestNonCurrentMessageBeforeUpdateRef = useRef<LocalMessage>(undefined);

  const shouldScrollToRecentOnNewOwnMessageRef = useShouldScrollToRecentOnNewOwnMessage(
    rawMessageList,
    client.userID,
  );

  const [autoscrollToRecent, setAutoscrollToRecent] = useState(false);

  const minIndexForVisible = Math.min(1, processedMessageList.length);

  // While the message overlay is open we suppress autoscroll-to-recent so that
  // incoming messages do not shift visible content and invalidate the overlay's
  // anchored geometry. Content anchoring (minIndexForVisible) stays on.
  const isOverlayOpen = useHasActiveId();

  const autoscrollToTopThreshold =
    autoscrollToRecent && !isOverlayOpen ? (isLiveStreaming ? 300 : 10) : undefined;

  const maintainVisibleContentPosition = useMemo(
    () => ({
      autoscrollToTopThreshold,
      minIndexForVisible,
    }),
    [autoscrollToTopThreshold, minIndexForVisible],
  );

  const flatListRef = useRef<FlatListType<MessageListItemWithNeighbours> | null>(null);

  /**
   * The timeout id used to debounce our scrollToIndex calls on messageList updates
   */
  const scrollToDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);

  /**
   * FlatList doesn't accept changeable function for onViewableItemsChanged prop.
   * Thus useRef.
   */
  const unstableOnViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken<MessageListItemWithNeighbours>[] | undefined;
  }) => {
    viewabilityChangedCallback({ inverted, viewableItems });

    if (!viewableItems) {
      return;
    }
    const viewableMessages = viewableItems.map((viewable) => viewable.item.message);
    // Inverted: the last viewable item is the topmost one on screen.
    const topVisibleMessage = viewableMessages[viewableMessages.length - 1];
    const isAtOldestMessage =
      topVisibleMessage !== undefined &&
      !paginator?.hasMoreTail &&
      processedMessageList[processedMessageList.length - 1]?.id === topVisibleMessage.id;

    if (!hideStickyDateHeader && topVisibleMessage) {
      updateStickyHeaderDate({ isAtOldestMessage, topVisibleMessage });
    }
    if (!threadList) {
      updateUnreadNotification({ isAtOldestMessage, topVisibleMessage, viewableMessages });
    }
    reportViewableMessages(viewableMessages);
  };

  const onViewableItemsChanged = useRef(unstableOnViewableItemsChanged);
  onViewableItemsChanged.current = unstableOnViewableItemsChanged;

  const stableOnViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<MessageListItemWithNeighbours>[] | undefined;
    }) => {
      onViewableItemsChanged.current({ viewableItems });
    },
    [],
  );

  useEffect(() => {
    if (disabled) {
      setScrollToBottomButtonVisible(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (threadList) {
      setAutoscrollToRecent(true);
      return;
    }

    if (!processedMessageList.length || !paginator) {
      return;
    }

    if (paginator.hasMoreHead) {
      latestNonCurrentMessageBeforeUpdateRef.current = paginator.lastMessage ?? undefined;
      setAutoscrollToRecent(false);
      setScrollToBottomButtonVisible(true);
      return;
    }
    const latestNonCurrentMessageBeforeUpdate = latestNonCurrentMessageBeforeUpdateRef.current;
    latestNonCurrentMessageBeforeUpdateRef.current = undefined;
    const latestCurrentMessageAfterUpdate = processedMessageList[0];
    if (!latestCurrentMessageAfterUpdate) {
      setAutoscrollToRecent(true);
      return;
    }
    // When the newest message did not change, jumping back to the latest set merged into the
    // window without anything new; otherwise new messages arrived, so keep following them.
    const shouldForceScrollToRecent =
      latestNonCurrentMessageBeforeUpdate?.id !== latestCurrentMessageAfterUpdate.id;

    // we don't want this behaviour while pruning, as it may scroll unnecessarily in
    // certain scenarios
    if ((maxLoadedItems && shouldForceScrollToRecent) || !maxLoadedItems) {
      setAutoscrollToRecent(shouldForceScrollToRecent);
    }

    if (shouldForceScrollToRecent) {
      const shouldScrollToRecentOnNewOwnMessage = shouldScrollToRecentOnNewOwnMessageRef.current();
      // we should scroll to bottom where ever we are now
      // as we have sent a new own message
      if (shouldScrollToRecentOnNewOwnMessage) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            animated: true,
            offset: 0,
          });
        }, WAIT_FOR_SCROLL_TIMEOUT); // flatlist might take a bit to update, so a small delay is needed
      }
    }
  }, [
    paginator,
    threadList,
    processedMessageList,
    shouldScrollToRecentOnNewOwnMessageRef,
    maxLoadedItems,
  ]);

  const lastFocusScrollTokenRef = useRef<number | undefined>(undefined);

  /**
   * Scrolls to the focused message (messageFocusSignal) once it's rendered. Keyed on the focus
   * token so it re-fires on every jump (even to the same id); also re-attempts when the list
   * updates while a focus is pending, and marks each token handled so unrelated list changes during
   * the highlight window don't re-scroll.
   */
  useEffect(() => {
    if (!focusedMessageId || focusToken === lastFocusScrollTokenRef.current) {
      return;
    }
    scrollToDebounceTimeoutRef.current = setTimeout(() => {
      const indexOfParentInMessageList = processedMessageList.findIndex(
        (message) => message?.id === focusedMessageId,
      );
      // Not in the rendered window yet (jumpToMessage already loaded-around it, so a later
      // processedMessageList change re-runs this) — bail rather than re-jump (no jump↔effect loop).
      if (indexOfParentInMessageList === -1 || !flatListRef.current) {
        return;
      }
      clearTimeout(scrollToDebounceTimeoutRef.current);
      clearTimeout(failScrollTimeoutId.current);
      scrollToIndexFailedRetryCountRef.current = 0;
      lastFocusScrollTokenRef.current = focusToken;
      flatListRef.current.scrollToIndex({
        animated: true,
        index: indexOfParentInMessageList,
        viewPosition: 0.5, // try to place message in the center of the screen
      });
      // Start the highlight's auto-dismiss countdown now that the message is scrolled into view.
      // The LLC deliberately does NOT start it on emit (the message may not be visible yet), so
      // without this the highlight would persist forever.
      paginator?.scheduleMessageFocusSignalClear({ token: focusToken });
    }, WAIT_FOR_SCROLL_TIMEOUT);
  }, [paginator, focusToken, focusedMessageId, processedMessageList]);

  const setNativeScrollability = useStableCallback((value: boolean) => {
    if (flatListRef.current) {
      flatListRef.current.setNativeProps({ scrollEnabled: value });
    }
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
   * Pagination is driven from the scroll position rather than FlatList's `onEndReached`: FlatList
   * has no `onStartReached`, and `onEndReachedThreshold` is a fraction of the content length, which
   * fires far too early in a long list. A fixed distance from either edge is used instead.
   */
  const onUserScrollEvent: NonNullable<ScrollViewProps['onScroll']> = useStableCallback((event) => {
    const nativeEvent = event.nativeEvent;
    const offset = nativeEvent.contentOffset.y;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;

    // Inverted: the start of the list is the newest end.
    const isScrollAtStart = offset < 100;
    const isScrollAtEnd = contentLength - visibleLength - offset < 100;

    if (isScrollAtStart) {
      loadMoreRecent();
    }

    if (isScrollAtEnd) {
      loadMore();
    }
  });

  const handleScroll: ScrollViewProps['onScroll'] = useStableCallback((event) => {
    const messageListHasMessages = processedMessageList.length > 0;
    const offset = event.nativeEvent.contentOffset.y;
    const isScrollAtBottom = offset <= messageInputHeight;

    /**
     * 1. If I scroll up -> show scrollToBottom button.
     * 2. If I scroll to bottom of screen
     *    |-> hide scrollToBottom button.
     *    |-> if channel is unread, call markRead().
     */
    setScrollToBottomButtonVisible(
      messageListHasMessages && (paginator?.hasMoreHead || !isScrollAtBottom),
    );

    if (onListScroll) {
      onListScroll(event);
    }
  });

  const goToNewMessages = useStableCallback(async () => {
    if (paginator?.hasMoreHead) {
      await paginator.jumpToTheLatestMessage();
    } else if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        animated: true,
        offset: 0,
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

  const scrollToBottomUnreadCount = useOwnUnreadCount(
    scrollToBottomButtonVisible && !threadList ? channel : undefined,
  );
  const {
    accessibilityActions: messageListAccessibilityActions,
    onAccessibilityAction: messageListOnAccessibilityAction,
  } = useScrollToBottomAccessibilityAction({
    accessibilityActions: additionalFlatListProps?.accessibilityActions,
    onAccessibilityAction: additionalFlatListProps?.onAccessibilityAction,
    onScrollToBottom: goToNewMessages,
    unreadCount: scrollToBottomUnreadCount,
    visible: scrollToBottomButtonVisible,
  });

  const scrollToIndexFailedRetryCountRef = useRef<number>(0);
  const failScrollTimeoutId = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onScrollToIndexFailedRef = useRef<
    FlatListProps<MessageListItemWithNeighbours>['onScrollToIndexFailed']
  >((info) => {
    // We got a failure as we tried to scroll to an item that was outside the render length
    if (!flatListRef.current) {
      return;
    }
    // we don't know the actual size of all items but we can see the average, so scroll to the closest offset
    // since we used only an average offset... we won't go to the center of the item yet
    // with a little delay to wait for scroll to offset to complete, we can then scroll to the index
    failScrollTimeoutId.current = setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          animated: true,
          index: info.index,
          viewPosition: 0.5, // try to place message in the center of the screen
        });
        // The highlight is driven by the live messageFocusSignal (persists for its TTL), so there's
        // no targeted-message state to re-set across scroll-fail retries.
        scrollToIndexFailedRetryCountRef.current = 0;
      } catch (e) {
        if (
          !onScrollToIndexFailedRef.current ||
          scrollToIndexFailedRetryCountRef.current > MAX_RETRIES_AFTER_SCROLL_FAILURE
        ) {
          scrollToIndexFailedRetryCountRef.current = 0;
          return;
        }
        // At some cases the index we're trying to scroll to, doesn't exist yet in the messageList
        // Scrolling to an index not in range of the Flatlist's data will result in a crash that
        // won't call onScrollToIndexFailed.
        // By catching this error we retry scrolling by calling onScrollToIndexFailedRef
        scrollToIndexFailedRetryCountRef.current += 1;
        onScrollToIndexFailedRef.current(info);
      }
    }, WAIT_FOR_SCROLL_TIMEOUT);

    // Only when index is greater than 0 and in range of items in FlatList
    // this onScrollToIndexFailed will be called again
  });

  const dismissImagePicker = useStableCallback(() => {
    if (attachmentPickerStore.state.getLatestValue().selectedPicker) {
      attachmentPickerStore.setSelectedPicker(undefined);
      closePicker();
    }
  });

  const refCallback = useStableCallback((ref: FlatListType<MessageListItemWithNeighbours>) => {
    flatListRef.current = ref;

    if (setFlatListRef) {
      setFlatListRef(ref);
    }
  });

  // We need to omit the style related props from the additionalFlatListProps and add them directly instead of spreading
  let additionalFlatListPropsExcludingStyle:
    | Omit<NonNullable<typeof additionalFlatListProps>, 'style' | 'contentContainerStyle'>
    | undefined;

  if (additionalFlatListProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentContainerStyle, style, ...rest } = additionalFlatListProps;
    additionalFlatListPropsExcludingStyle = rest;
  }

  const flatListStyle = useMemo(
    () => [styles.listContainer, additionalFlatListProps?.style],
    [additionalFlatListProps?.style, styles.listContainer],
  );

  /**
   * `strictMode` only became a `FlatList` prop in React Native 0.87, and this SDK supports `>=0.79`.
   * Passed via spread rather than as a literal attribute because JSX excess-property checking does
   * not apply to spreads, so this compiles on every supported version. A `@ts-expect-error` cannot
   * work here: it is required below 0.87 and reported as unused from 0.87 onwards.
   */
  const liveStreamingListProps = useMemo(
    () => ({ strictMode: isLiveStreaming }),
    [isLiveStreaming],
  );

  const flatListContentContainerStyle = useMemo(
    () => [
      { paddingTop: messageInputFloating ? messageInputHeight : 0 },
      styles.contentContainer,
      additionalFlatListProps?.contentContainerStyle,
    ],
    [
      additionalFlatListProps?.contentContainerStyle,
      styles.contentContainer,
      messageInputHeight,
      messageInputFloating,
    ],
  );

  const ListComponent = animateLayout ? AnimatedList : FlatList;

  const viewportHeightRef = useRef<number>(undefined);

  /**
   * This debounced callback makes sure that if the current number of messages do not
   * fill our screen, we load more messages continuously until we cover enough ground.
   */
  const debouncedPrefillMessages = useMemo(
    () =>
      debounce(
        (viewportHeight: number, contentHeight: number) => {
          if (viewportHeight >= contentHeight) {
            loadMore();
          }
        },
        500,
        {
          leading: false,
          trailing: true,
        },
      ),
    [loadMore],
  );

  const onContentSizeChange = useStableCallback((width: number, height: number) => {
    if (additionalFlatListProps?.onContentSizeChange) {
      additionalFlatListProps.onContentSizeChange(width, height);
    }

    debouncedPrefillMessages(viewportHeightRef.current ?? 0, height);
  });

  const onLayout = useStableCallback((event: LayoutChangeEvent) => {
    if (additionalFlatListProps?.onLayout) {
      additionalFlatListProps.onLayout(event);
    }
    const nextViewportHeight = event.nativeEvent.layout.height;
    if (viewportHeightRef.current !== nextViewportHeight) {
      const previousViewportHeight = viewportHeightRef.current ?? nextViewportHeight;
      const closeCorrectionDeltaY = nextViewportHeight - previousViewportHeight;
      bumpOverlayLayoutRevision(closeCorrectionDeltaY);
    }
    viewportHeightRef.current = nextViewportHeight;
  });

  const ListFooterComponent = useCallback(
    () => <FooterComponent loadingMore={loadingMore} />,
    [FooterComponent, loadingMore],
  );

  const ListHeaderComponent = useCallback(() => {
    if (HeaderComponent) {
      return <HeaderComponent />;
    }

    return (
      <>
        <InlineLoadingMoreRecentIndicator loadingMoreRecent={loadingMoreRecent} />
        {!disableTypingIndicator && TypingIndicator && (
          <TypingIndicatorContainer>
            <TypingIndicator />
          </TypingIndicatorContainer>
        )}
      </>
    );
  }, [
    HeaderComponent,
    loadingMoreRecent,
    TypingIndicator,
    TypingIndicatorContainer,
    disableTypingIndicator,
  ]);

  if (!ListComponent) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingIndicator listType='message' />
      </View>
    );
  }

  // TODO: Make sure this is actually overridable as the previous FlatList was.
  return (
    <View style={styles.container} testID='message-flat-list-wrapper'>
      {/* Don't show the empty list indicator for Thread messages */}
      {processedMessageList.length === 0 && !threadList ? (
        <View style={styles.flex} testID='empty-state'>
          {EmptyStateIndicator ? <EmptyStateIndicator listType='message' /> : null}
        </View>
      ) : (
        <MessageListItemProvider value={messageListItemContextValue}>
          <ListComponent
            // TODO: Consider hiding this behind a feature flag.
            layout={transitions.layout200}
            contentContainerStyle={flatListContentContainerStyle}
            /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
            data={processedMessageListWithNeighbors}
            inverted={inverted}
            keyboardShouldPersistTaps='handled'
            keyExtractor={keyExtractor}
            ListFooterComponent={ListFooterComponent}
            ListHeaderComponent={ListHeaderComponent}
            /**
            If autoscrollToTopThreshold is 10, we scroll to recent only if before the update, the list was already at the
            bottom (10 offset or below).
            minIndexForVisible = 1 means that beyond the item at index 1 we will not change the position on list updates,
            however it is not used when autoscrollToTopThreshold = 10.
          */
            maintainVisibleContentPosition={maintainVisibleContentPosition}
            maxToRenderPerBatch={30}
            onContentSizeChange={onContentSizeChange}
            onLayout={onLayout}
            onMomentumScrollEnd={onUserScrollEvent}
            onScroll={handleScroll}
            onScrollBeginDrag={onUserScrollEvent}
            onScrollEndDrag={onUserScrollEvent}
            onScrollToIndexFailed={onScrollToIndexFailedRef.current}
            onTouchEnd={dismissImagePicker}
            onViewableItemsChanged={stableOnViewableItemsChanged}
            ref={refCallback}
            renderItem={renderItem}
            scrollEventThrottle={isLiveStreaming ? 16 : undefined}
            showsVerticalScrollIndicator={false}
            style={flatListStyle}
            testID='message-flat-list'
            viewabilityConfig={flatListViewabilityConfig}
            {...liveStreamingListProps}
            {...additionalFlatListPropsExcludingStyle}
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
        {processedMessageList.length > 0 && StickyHeader ? (
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
          />
        </Animated.View>
      ) : null}

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
        filter={pendingUploadsEnabled ? excludeCanceledUploadNotifications : undefined}
      />
    </View>
  );
};

export type MessageListProps = Partial<MessageListPropsWithContext>;

export const MessageList = (props: MessageListProps) => {
  const { closePicker, attachmentPickerStore } = useAttachmentPickerContext();
  const { channel, disabled, enableMessageGroupingByUser, hideStickyDateHeader, threadList } =
    useChannelContext();
  const markRead = useMarkRead(channel);
  const { client } = useChatContext();
  const { readEvents } = useOwnCapabilitiesContext();
  const { disableTypingIndicator, FlatList, myMessageTheme } = useMessagesContext();
  const pendingUploadsEnabled = usePendingUploadsEnabled();
  const { messageInputFloating, messageInputHeightStore } = useMessageInputContext();
  const { threadInstance } = useThreadContext();

  return (
    <MessageListWithContext
      {...{
        attachmentPickerStore,
        channel,
        client,
        closePicker,
        disabled,
        disableTypingIndicator,
        FlatList,
        hideStickyDateHeader,
        markRead,
        messageInputFloating,
        messageInputHeightStore,
        myMessageTheme,
        pendingUploadsEnabled,
        readEvents,
        threadInstance,
        threadList,
      }}
      {...props}
      noGroupByUser={!enableMessageGroupingByUser || props.noGroupByUser}
    />
  );
};

// SOme notes about why we're relying on `createAnimatedComponent` instead of `Animated.FlatList`:
// 1. `Animated.FlatList` is much less performant for what we need. We essentially need simple
//    `layout` animations to account for the list's outer container switching layout. What we're
//    getting however, is an animated `CellRenderer` component as well as scroll event throttling
//    reduced to 1. Since we don't really want any of this, we stick to doing it ourselves.
// 2. We need to memoize the output because of the fact that `createAnimatedComponent` changes the
//    identity of the `style` prop on every render. It also seems to be an intended thing too,
//    so not something that's going to change soon. This means that whenever our `MessageList`
//    rerenders (but the list's props remain stable), it anyway rerenders internally as well (for
//    about half of the milliseconds it takes for a full `data` rerender !). This affects performance
//    significantly, especially in high ingress scenarios (i.e a livestream).
const AnimatedList = React.memo(
  Animated.createAnimatedComponent(FlatList<MessageListItemWithNeighbours>),
);
