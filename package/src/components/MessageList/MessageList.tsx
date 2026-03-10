import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  FlatList as FlatListType,
  LayoutChangeEvent,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import debounce from 'lodash/debounce';

import type { Channel, Event, LocalMessage, MessageResponse } from 'stream-chat';

import { useMessageList } from './hooks/useMessageList';
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

import { useStableCallback } from '../../hooks';
import { useStateStore } from '../../hooks/useStateStore';
import { bumpOverlayLayoutRevision } from '../../state-store';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import { MessageWrapper } from '../Message/MessageSimple/MessageWrapper';

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

const flatListViewabilityConfig: ViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 1,
};

const hasReadLastMessage = (channel: Channel, userId: string) => {
  const latestMessageIdInChannel = channel.state.latestMessages.slice(-1)[0]?.id;
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

type MessageListPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'closePicker' | 'attachmentPickerStore'
> &
  Pick<OwnCapabilitiesContextValue, 'readEvents'> &
  Pick<
    ChannelContextValue,
    | 'channel'
    | 'channelUnreadStateStore'
    | 'disabled'
    | 'EmptyStateIndicator'
    | 'hideStickyDateHeader'
    | 'loadChannelAroundMessage'
    | 'loading'
    | 'LoadingIndicator'
    | 'markRead'
    | 'NetworkDownIndicator'
    | 'reloadChannel'
    | 'scrollToFirstUnreadThreshold'
    | 'setChannelUnreadState'
    | 'setTargetedMessage'
    | 'StickyHeader'
    | 'targetedMessage'
    | 'threadList'
    | 'maximumMessageLimit'
  > &
  Pick<ChatContextValue, 'client'> &
  Pick<PaginatedMessageListContextValue, 'loadMore' | 'loadMoreRecent' | 'hasMore'> &
  Pick<
    MessagesContextValue,
    | 'DateHeader'
    | 'disableTypingIndicator'
    | 'FlatList'
    | 'InlineDateSeparator'
    | 'InlineUnreadIndicator'
    | 'Message'
    | 'ScrollToBottomButton'
    | 'myMessageTheme'
    | 'TypingIndicator'
    | 'TypingIndicatorContainer'
    | 'UnreadMessagesNotification'
  > &
  Pick<MessageInputContextValue, 'messageInputFloating' | 'messageInputHeightStore'> &
  Pick<
    ThreadContextValue,
    'loadMoreRecentThread' | 'loadMoreThread' | 'threadHasMore' | 'thread' | 'threadInstance'
  > & {
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
    onThreadSelect?: (message: ThreadContextValue['thread']) => void;
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
  const LoadingMoreRecentIndicator = props.threadList
    ? InlineLoadingMoreRecentThreadIndicator
    : InlineLoadingMoreRecentIndicator;
  const {
    animateLayout = true,
    attachmentPickerStore,
    additionalFlatListProps,
    channel,
    channelUnreadStateStore,
    client,
    closePicker,
    DateHeader,
    disabled,
    disableTypingIndicator,
    EmptyStateIndicator,
    FlatList,
    FooterComponent = InlineLoadingMoreIndicator,
    HeaderComponent,
    hideStickyDateHeader,
    inverted = true,
    isLiveStreaming = false,
    loadChannelAroundMessage,
    loading,
    LoadingIndicator,
    loadMore,
    loadMoreRecent,
    loadMoreRecentThread,
    loadMoreThread,
    markRead,
    maximumMessageLimit,
    messageInputFloating,
    messageInputHeightStore,
    myMessageTheme,
    NetworkDownIndicator,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    readEvents,
    reloadChannel,
    ScrollToBottomButton,
    setChannelUnreadState,
    setFlatListRef,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    thread,
    threadInstance,
    threadList = false,
    TypingIndicator,
    TypingIndicatorContainer,
    UnreadMessagesNotification,
    hasMore,
    threadHasMore,
  } = props;
  const [isUnreadNotificationOpen, setIsUnreadNotificationOpen] = useState<boolean>(false);
  const { theme } = useTheme();
  const styles = useStyles();
  const { height: messageInputHeight } = useStateStore(
    messageInputHeightStore.store,
    messageInputHeightStoreSelector,
  );

  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

  const modifiedTheme = useMemo(
    () => mergeThemes({ style: myMessageTheme, theme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myMessageThemeString, theme],
  );

  /**
   * NOTE: rawMessageList changes only when messages array state changes
   * processedMessageList changes on any state change
   */
  const { processedMessageList, rawMessageList, viewabilityChangedCallback } = useMessageList({
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

  const messageListLengthBeforeUpdate = useRef(0);
  const messageListLengthAfterUpdate = processedMessageList.length;

  /**
   * We need topMessage and channelLastRead values to set the initial scroll position.
   * So these values only get used if `initialScrollToFirstUnreadMessage` prop is true.
   */
  const topMessageBeforeUpdate = useRef<LocalMessage>(undefined);
  const latestNonCurrentMessageBeforeUpdateRef = useRef<LocalMessage>(undefined);
  const topMessageAfterUpdate: LocalMessage | undefined = rawMessageList[0];

  const shouldScrollToRecentOnNewOwnMessageRef = useShouldScrollToRecentOnNewOwnMessage(
    rawMessageList,
    client.userID,
  );

  const [autoscrollToRecent, setAutoscrollToRecent] = useState(false);

  const minIndexForVisible = Math.min(1, processedMessageList.length);

  const autoscrollToTopThreshold = autoscrollToRecent ? (isLiveStreaming ? 300 : 10) : undefined;

  const maintainVisibleContentPosition = useMemo(
    () => ({
      autoscrollToTopThreshold,
      minIndexForVisible,
    }),
    [autoscrollToTopThreshold, minIndexForVisible],
  );

  /**
   * We want to call onEndReached and onStartReached only once, per content length.
   * We keep track of calls to these functions per content length, with following trackers.
   */
  const onStartReachedTracker = useRef<Record<number, boolean>>({});
  const onEndReachedTracker = useRef<Record<number, boolean>>({});

  const onStartReachedInPromise = useRef<Promise<void> | null>(null);
  const onEndReachedInPromise = useRef<Promise<void> | null>(null);

  const flatListRef = useRef<FlatListType<MessageListItemWithNeighbours> | null>(null);

  const channelResyncScrollSet = useRef<boolean>(true);

  /**
   * The timeout id used to debounce our scrollToIndex calls on messageList updates
   */
  const scrollToDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /**
   * The timeout id used to temporarily load the initial scroll set flag
   */
  const onScrollEventTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /**
   * Last messageID that was scrolled to after loading a new message list,
   * this flag keeps track of it so that we dont scroll to it again on target message set
   */
  const messageIdLastScrolledToRef = useRef<string>(undefined);
  const [hasMoved, setHasMoved] = useState(false);

  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);

  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date | undefined>();
  const stickyHeaderDateRef = useRef<Date | undefined>(undefined);

  // ref for channel to use in useEffect without triggering it on channel change
  const channelRef = useRef(channel);
  channelRef.current = channel;

  const updateStickyHeaderDateIfNeeded = useStableCallback((viewableItems: ViewToken[]) => {
    if (!viewableItems.length) {
      return;
    }

    const lastMessage = viewableItems[viewableItems.length - 1].item?.message;

    if (lastMessage) {
      if (
        !channel.state.messagePagination.hasPrev &&
        processedMessageList[processedMessageList.length - 1].id === lastMessage.id
      ) {
        setStickyHeaderDate(undefined);
        return;
      }
      const isMessageTypeDeleted = lastMessage.type === 'deleted';

      if (
        lastMessage?.created_at &&
        !isMessageTypeDeleted &&
        typeof lastMessage.created_at !== 'string' &&
        lastMessage.created_at.toDateString() !== stickyHeaderDateRef.current?.toDateString()
      ) {
        stickyHeaderDateRef.current = lastMessage.created_at;
        setStickyHeaderDate(lastMessage.created_at);
      }
    }
  });

  /**
   * This function should show or hide the unread indicator depending on the
   */
  const updateStickyUnreadIndicator = useStableCallback((viewableItems: ViewToken[]) => {
    const channelUnreadState = channelUnreadStateStore.channelUnreadState;
    // we need this check to make sure that regular list change do not trigger
    // the unread notification to appear (for example if the old last read messages
    // go out of the viewport).
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

    const lastItem = viewableItems[viewableItems.length - 1].item;

    if (lastItem) {
      const lastItemMessage = lastItem.message;
      const lastItemCreatedAt = lastItemMessage.created_at;

      const unreadIndicatorDate = channelUnreadState?.last_read?.getTime();
      const lastItemDate = lastItemCreatedAt.getTime();

      if (
        !channel.state.messagePagination.hasPrev &&
        processedMessageList[processedMessageList.length - 1].id === lastItemMessage.id
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
    viewabilityChangedCallback({ inverted, viewableItems });

    if (!viewableItems) {
      return;
    }
    if (!hideStickyDateHeader) {
      updateStickyHeaderDateIfNeeded(viewableItems);
    }
    updateStickyUnreadIndicator(viewableItems);
  };

  const onViewableItemsChanged = useRef(unstableOnViewableItemsChanged);
  onViewableItemsChanged.current = unstableOnViewableItemsChanged;

  const stableOnViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] | undefined }) => {
      onViewableItemsChanged.current({ viewableItems });
    },
    [],
  );

  /**
   * Resets the pagination trackers, doing so cancels currently scheduled loading more calls
   */
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
   * Effect to mark the channel as read when the user scrolls to the bottom of the message list.
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
      // When the scrollToBottomButtonVisible is true, we need to manually update the channelUnreadState when its a received message.
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
              : new Date(0)), // not having information about the last read message means the whole channel is unread,
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
     * Condition to check if a message is removed from MessageList.
     * Eg: This would happen when giphy search is cancelled, message is deleted with visibility "never" etc.
     * If such a case arises, we scroll to bottom.
     */
    const isMessageRemovedFromMessageList =
      messageListLengthAfterUpdate < messageListLengthBeforeUpdate.current;
    /**
     * Scroll down when
     * created_at timestamp of top message before update is lesser than created_at timestamp of top message after update - channel has resynced
     */
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
          flatListRef.current?.scrollToOffset({
            offset: 0,
          });
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
        // pruning has happened, reset the trackers
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
    const latestCurrentMessageAfterUpdate = processedMessageList[0];
    if (!latestCurrentMessageAfterUpdate) {
      setAutoscrollToRecent(true);
      return;
    }
    const didMergeMessageSetsWithNoUpdates =
      latestNonCurrentMessageBeforeUpdate?.id === latestCurrentMessageAfterUpdate.id;
    // if didMergeMessageSetsWithNoUpdates=false, we got new messages
    // so we should scroll to bottom if we are near the bottom already
    const shouldForceScrollToRecent =
      !didMergeMessageSetsWithNoUpdates ||
      processedMessageList.length - messageListLengthBeforeUpdate.current > 0;

    // we don't want this behaviour while pruning, as it may scroll unnecessarily in
    // certain scenarios
    if ((maximumMessageLimit && shouldForceScrollToRecent) || !maximumMessageLimit) {
      setAutoscrollToRecent(shouldForceScrollToRecent);
    }

    if (!didMergeMessageSetsWithNoUpdates) {
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
    channel,
    threadList,
    processedMessageList,
    shouldScrollToRecentOnNewOwnMessageRef,
    maximumMessageLimit,
  ]);

  const goToMessage = useStableCallback(async (messageId: string) => {
    const indexOfParentInMessageList = processedMessageList.findIndex(
      (message) => message?.id === messageId,
    );
    try {
      if (indexOfParentInMessageList === -1) {
        await loadChannelAroundMessage({ messageId });
        return;
      } else {
        if (!flatListRef.current) {
          return;
        }
        clearTimeout(failScrollTimeoutId.current);
        scrollToIndexFailedRetryCountRef.current = 0;
        // keep track of this messageId, so that we dont scroll to again in useEffect for targeted message change
        messageIdLastScrolledToRef.current = messageId;
        setTargetedMessage(messageId);
        // now scroll to it with animated=true
        flatListRef.current.scrollToIndex({
          animated: true,
          index: indexOfParentInMessageList,
          viewPosition: 0.5, // try to place message in the center of the screen
        });
        return;
      }
    } catch (e) {
      console.warn('Error while scrolling to message', e);
    }
  });

  /**
   * Check if a messageId needs to be scrolled to after list loads, and scroll to it
   * Note: This effect fires on every list change with a small debounce so that scrolling isnt abrupted by an immediate rerender
   */
  useEffect(() => {
    if (!targetedMessage) {
      return;
    }
    scrollToDebounceTimeoutRef.current = setTimeout(async () => {
      const indexOfParentInMessageList = processedMessageList.findIndex(
        (message) => message?.id === targetedMessage,
      );

      // the message we want to scroll to has not been loaded in the state yet
      if (indexOfParentInMessageList === -1) {
        await loadChannelAroundMessage({ messageId: targetedMessage, setTargetedMessage });
      } else {
        if (!flatListRef.current) {
          return;
        }
        // By a fresh scroll we should clear the retries for the previous failed scroll
        clearTimeout(scrollToDebounceTimeoutRef.current);
        clearTimeout(failScrollTimeoutId.current);
        // reset the retry count
        scrollToIndexFailedRetryCountRef.current = 0;
        // now scroll to it
        flatListRef.current.scrollToIndex({
          animated: true,
          index: indexOfParentInMessageList,
          viewPosition: 0.5, // try to place message in the center of the screen
        });
        setTargetedMessage(undefined);
      }
    }, WAIT_FOR_SCROLL_TIMEOUT);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetedMessage]);

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
   * 1. Makes a call to `loadMoreRecent` function, which queries more recent messages.
   * 2. Ensures that we call `loadMoreRecent`, once per content length
   * 3. If the call to `loadMore` is in progress, we wait for it to finish to make sure scroll doesn't jump.
   */
  const maybeCallOnStartReached = useStableCallback(async () => {
    // If onStartReached has already been called for given data length, then ignore.
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
      /** Release the onStartReached trigger after 2 seconds, to try again */
      setTimeout(() => {
        onStartReachedTracker.current = {};
      }, 2000);
    };

    // If onEndReached is in progress, better to wait for it to finish for smooth UX
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

  /**
   * 1. Makes a call to `loadMore` function, which queries more older messages.
   * 2. Ensures that we call `loadMore`, once per content length
   * 3. If the call to `loadMoreRecent` is in progress, we wait for it to finish to make sure scroll doesn't jump.
   */
  const maybeCallOnEndReached = useStableCallback(async () => {
    const shouldQuery = (threadList && threadHasMore) || (!threadList && hasMore);
    // If onEndReached has already been called for given messageList length, then ignore.
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
      /** Release the onEndReachedTracker trigger after 2 seconds, to try again */
      setTimeout(() => {
        onEndReachedTracker.current = {};
      }, 2000);
    };

    // If onStartReached is in progress, better to wait for it to finish for smooth UX
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

    // Check if scroll has reached either start of end of list.
    const isScrollAtStart = offset < 100;
    const isScrollAtEnd = contentLength - visibleLength - offset < 100;

    if (isScrollAtStart) {
      maybeCallOnStartReached();
    }

    if (isScrollAtEnd) {
      maybeCallOnEndReached();
    }
  });

  const handleScroll: ScrollViewProps['onScroll'] = useStableCallback((event) => {
    const messageListHasMessages = processedMessageList.length > 0;
    const offset = event.nativeEvent.contentOffset.y;
    const isScrollAtBottom = offset <= messageInputHeight;

    const notLatestSet = channel.state.messages !== channel.state.latestMessages;

    const showScrollToBottomButton =
      messageListHasMessages && ((!threadList && notLatestSet) || !isScrollAtBottom);

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
    const isNotLatestSet = channel.state.messages !== channel.state.latestMessages;

    if (isNotLatestSet) {
      resetPaginationTrackersRef.current();
      await reloadChannel();
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
        if (messageIdLastScrolledToRef.current) {
          // in case the target message was cleared out
          // the state being set again will trigger the highlight again
          setTargetedMessage(messageIdLastScrolledToRef.current);
        }
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

  const onScrollBeginDrag: ScrollViewProps['onScrollBeginDrag'] = useStableCallback((event) => {
    !hasMoved && attachmentPickerStore.state.getLatestValue().selectedPicker && setHasMoved(true);
    onUserScrollEvent(event);
  });

  const onScrollEndDrag: ScrollViewProps['onScrollEndDrag'] = useStableCallback((event) => {
    hasMoved && attachmentPickerStore.state.getLatestValue().selectedPicker && setHasMoved(false);
    onUserScrollEvent(event);
  });

  const refCallback = useStableCallback((ref: FlatListType<MessageListItemWithNeighbours>) => {
    flatListRef.current = ref;

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
            maybeCallOnEndReached();
          }
        },
        500,
        {
          leading: false,
          trailing: true,
        },
      ),
    [maybeCallOnEndReached],
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

  const ListHeaderComponent = useCallback(() => {
    if (HeaderComponent) {
      return <HeaderComponent />;
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
    HeaderComponent,
    LoadingMoreRecentIndicator,
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
      {processedMessageList.length === 0 && !thread ? (
        <View style={styles.flex} testID='empty-state'>
          {EmptyStateIndicator ? <EmptyStateIndicator listType='message' /> : null}
        </View>
      ) : (
        <MessageListItemProvider value={messageListItemContextValue}>
          <ListComponent
            // TODO: Consider hiding this behind a feature flag.
            layout={LayoutTransition}
            contentContainerStyle={flatListContentContainerStyle}
            /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
            data={processedMessageListWithNeighbors}
            extraData={disabled}
            inverted={inverted}
            keyboardShouldPersistTaps='handled'
            keyExtractor={keyExtractor}
            ListFooterComponent={FooterComponent}
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
            onScrollBeginDrag={onScrollBeginDrag}
            onScrollEndDrag={onScrollEndDrag}
            onScrollToIndexFailed={onScrollToIndexFailedRef.current}
            onTouchEnd={dismissImagePicker}
            onViewableItemsChanged={stableOnViewableItemsChanged}
            ref={refCallback}
            renderItem={renderItem}
            scrollEventThrottle={isLiveStreaming ? 16 : undefined}
            showsVerticalScrollIndicator={false}
            // @ts-expect-error Safe to do for now
            strictMode={isLiveStreaming}
            style={flatListStyle}
            testID='message-flat-list'
            viewabilityConfig={flatListViewabilityConfig}
            {...additionalFlatListPropsExcludingStyle}
          />
        </MessageListItemProvider>
      )}
      <View style={styles.stickyHeaderContainer}>
        {messageListLengthAfterUpdate && StickyHeader ? (
          <StickyHeader date={stickyHeaderDate} DateHeader={DateHeader} />
        ) : null}
      </View>
      {scrollToBottomButtonVisible ? (
        <Animated.View
          layout={LinearTransition.duration(200)}
          style={[
            {
              bottom: messageInputFloating
                ? messageInputHeight + primitives.spacingMd
                : primitives.spacingMd,
            },
            styles.scrollToBottomButtonContainer,
          ]}
        >
          <ScrollToBottomButton
            onPress={goToNewMessages}
            showNotification={scrollToBottomButtonVisible}
            unreadCount={threadList ? 0 : channel?.countUnread()}
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
    </View>
  );
};

export type MessageListProps = Partial<MessageListPropsWithContext>;

export const MessageList = (props: MessageListProps) => {
  const { closePicker, attachmentPickerStore } = useAttachmentPickerContext();
  const {
    channel,
    channelUnreadStateStore,
    disabled,
    EmptyStateIndicator,
    enableMessageGroupingByUser,
    error,
    hideStickyDateHeader,
    highlightedMessageId,
    loadChannelAroundMessage,
    loading,
    LoadingIndicator,
    maximumMessageLimit,
    markRead,
    NetworkDownIndicator,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    setChannelUnreadState,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    threadList,
  } = useChannelContext();
  const { client } = useChatContext();
  const { readEvents } = useOwnCapabilitiesContext();
  const {
    DateHeader,
    disableTypingIndicator,
    FlatList,
    InlineDateSeparator,
    InlineUnreadIndicator,
    Message,
    MessageSystem,
    myMessageTheme,
    ScrollToBottomButton,
    shouldShowUnreadUnderlay,
    TypingIndicator,
    TypingIndicatorContainer,
    UnreadMessagesNotification,
  } = useMessagesContext();
  const { messageInputFloating, messageInputHeightStore } = useMessageInputContext();
  const { loadMore, loadMoreRecent, hasMore } = usePaginatedMessageListContext();
  const { loadMoreRecentThread, loadMoreThread, threadHasMore, thread, threadInstance } =
    useThreadContext();

  return (
    <MessageListWithContext
      {...{
        attachmentPickerStore,
        channel,
        channelUnreadStateStore,
        client,
        closePicker,
        DateHeader,
        disabled,
        disableTypingIndicator,
        EmptyStateIndicator,
        enableMessageGroupingByUser,
        error,
        FlatList,
        hideStickyDateHeader,
        highlightedMessageId,
        InlineDateSeparator,
        InlineUnreadIndicator,
        loadChannelAroundMessage,
        loading,
        LoadingIndicator,
        loadMore,
        loadMoreRecent,
        loadMoreRecentThread,
        loadMoreThread,
        markRead,
        maximumMessageLimit,
        Message,
        messageInputFloating,
        messageInputHeightStore,
        MessageSystem,
        myMessageTheme,
        NetworkDownIndicator,
        readEvents,
        reloadChannel,
        ScrollToBottomButton,
        scrollToFirstUnreadThreshold,
        setChannelUnreadState,
        setTargetedMessage,
        shouldShowUnreadUnderlay,
        StickyHeader,
        targetedMessage,
        thread,
        threadInstance,
        threadList,
        TypingIndicator,
        TypingIndicatorContainer,
        UnreadMessagesNotification,
        hasMore,
        threadHasMore,
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

const LayoutTransition = LinearTransition.duration(200);
