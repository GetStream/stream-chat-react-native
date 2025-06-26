import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatListProps,
  FlatList as FlatListType,
  Platform,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';

import type { Channel, Event, LocalMessage, MessageResponse } from 'stream-chat';

import { useMessageList } from './hooks/useMessageList';
import { useShouldScrollToRecentOnNewOwnMessage } from './hooks/useShouldScrollToRecentOnNewOwnMessage';

import { InlineLoadingMoreIndicator } from './InlineLoadingMoreIndicator';
import { InlineLoadingMoreRecentIndicator } from './InlineLoadingMoreRecentIndicator';
import { InlineLoadingMoreRecentThreadIndicator } from './InlineLoadingMoreRecentThreadIndicator';
import { getLastReceivedMessage } from './utils/getLastReceivedMessage';

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
  ImageGalleryContextValue,
  useImageGalleryContext,
} from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  PaginatedMessageListContextValue,
  usePaginatedMessageListContext,
} from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { mergeThemes, ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import { useStableCallback } from '../../hooks';
import { FileTypes } from '../../types/types';

// This is just to make sure that the scrolling happens in a different task queue.
// TODO: Think if we really need this and strive to remove it if we can.
const WAIT_FOR_SCROLL_TIMEOUT = 0;
const MAX_RETRIES_AFTER_SCROLL_FAILURE = 10;
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    /**
     * paddingBottom is set to 4 to account for the default date
     * header and inline indicator alignment. The top margin is 8
     * on the header but 4 on the inline date, this adjusts the spacing
     * to allow the "first" inline date to align with the date header.
     */
    paddingBottom: 4,
  },
  flex: { flex: 1 },
  invertAndroid: {
    // Invert the Y AND X axis to prevent a react native issue that can lead to ANRs on android 13
    // details: https://github.com/Expensify/App/pull/12820
    transform: [{ scaleX: -1 }, { scaleY: -1 }],
  },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
  },
});

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
  'closePicker' | 'selectedPicker' | 'setSelectedPicker'
> &
  Pick<
    ChannelContextValue,
    | 'channel'
    | 'channelUnreadState'
    | 'disabled'
    | 'EmptyStateIndicator'
    | 'hideStickyDateHeader'
    | 'highlightedMessageId'
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
  > &
  Pick<ChatContextValue, 'client'> &
  Pick<ImageGalleryContextValue, 'setMessages'> &
  Pick<PaginatedMessageListContextValue, 'loadMore' | 'loadMoreRecent'> &
  Pick<
    MessagesContextValue,
    | 'DateHeader'
    | 'disableTypingIndicator'
    | 'FlatList'
    | 'InlineDateSeparator'
    | 'InlineUnreadIndicator'
    | 'legacyImageViewerSwipeBehaviour'
    | 'Message'
    | 'ScrollToBottomButton'
    | 'MessageSystem'
    | 'myMessageTheme'
    | 'shouldShowUnreadUnderlay'
    | 'TypingIndicator'
    | 'TypingIndicatorContainer'
    | 'UnreadMessagesNotification'
  > &
  Pick<
    ThreadContextValue,
    'loadMoreRecentThread' | 'loadMoreThread' | 'thread' | 'threadInstance'
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
    additionalFlatListProps?: Partial<FlatListProps<LocalMessage>>;
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
    isListActive?: boolean;
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
    setFlatListRef?: (ref: FlatListType<LocalMessage> | null) => void;
  };

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
    additionalFlatListProps,
    channel,
    channelUnreadState,
    client,
    closePicker,
    DateHeader,
    disabled,
    disableTypingIndicator,
    EmptyStateIndicator,
    FlatList,
    FooterComponent = InlineLoadingMoreIndicator,
    HeaderComponent = LoadingMoreRecentIndicator,
    hideStickyDateHeader,
    highlightedMessageId,
    InlineDateSeparator,
    InlineUnreadIndicator,
    inverted = true,
    isListActive = false,
    legacyImageViewerSwipeBehaviour,
    loadChannelAroundMessage,
    loading,
    LoadingIndicator,
    loadMore,
    loadMoreRecent,
    loadMoreRecentThread,
    loadMoreThread,
    markRead,
    Message,
    MessageSystem,
    myMessageTheme,
    NetworkDownIndicator,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    reloadChannel,
    ScrollToBottomButton,
    selectedPicker,
    setChannelUnreadState,
    setFlatListRef,
    setMessages,
    setSelectedPicker,
    setTargetedMessage,
    shouldShowUnreadUnderlay,
    StickyHeader,
    targetedMessage,
    thread,
    threadInstance,
    threadList = false,
    TypingIndicator,
    TypingIndicatorContainer,
    UnreadMessagesNotification,
  } = props;
  const [isUnreadNotificationOpen, setIsUnreadNotificationOpen] = useState<boolean>(false);
  const { theme } = useTheme();

  const {
    colors: { white_snow },
    messageList: { container, contentContainer, listContainer, messageContainer },
    screenPadding,
  } = theme;

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
  const { dateSeparatorsRef, messageGroupStylesRef, processedMessageList, rawMessageList } =
    useMessageList({
      noGroupByUser,
      threadList,
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

  const maintainVisibleContentPosition = useMemo(
    () => ({
      autoscrollToTopThreshold: autoscrollToRecent ? 10 : undefined,
      minIndexForVisible,
    }),
    [autoscrollToRecent, minIndexForVisible],
  );

  /**
   * We want to call onEndReached and onStartReached only once, per content length.
   * We keep track of calls to these functions per content length, with following trackers.
   */
  const onStartReachedTracker = useRef<Record<number, boolean>>({});
  const onEndReachedTracker = useRef<Record<number, boolean>>({});

  const onStartReachedInPromise = useRef<Promise<void> | null>(null);
  const onEndReachedInPromise = useRef<Promise<void> | null>(null);

  const flatListRef = useRef<FlatListType<LocalMessage> | null>(null);

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
  const lastReceivedId = useMemo(
    () => getLastReceivedMessage(processedMessageList)?.id,
    [processedMessageList],
  );
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

    const lastItem = viewableItems[viewableItems.length - 1];

    if (lastItem) {
      if (
        !channel.state.messagePagination.hasPrev &&
        processedMessageList[processedMessageList.length - 1].id === lastItem.item.id
      ) {
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
    }
  });

  const messagesLength = useRef<number>(processedMessageList.length);

  /**
   * This function should show or hide the unread indicator depending on the
   */
  const updateStickyUnreadIndicator = useStableCallback((viewableItems: ViewToken[]) => {
    // we need this check to make sure that regular list change do not trigger
    // the unread notification to appear (for example if the old last read messages
    // go out of the viewport).
    if (processedMessageList.length !== messagesLength.current) {
      return;
    }
    messagesLength.current = processedMessageList.length;

    if (!viewableItems.length) {
      setIsUnreadNotificationOpen(false);
      return;
    }

    if (selectedPicker === 'images') {
      setIsUnreadNotificationOpen(false);
      return;
    }

    const lastItem = viewableItems[viewableItems.length - 1];

    if (lastItem) {
      const lastItemMessage = lastItem.item;
      const lastItemCreatedAt = lastItemMessage.created_at;

      const unreadIndicatorDate = channelUnreadState?.last_read.getTime();
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
      return (
        !channelUnreadState?.first_unread_message_id &&
        !scrollToBottomButtonVisible &&
        client.user?.id &&
        !hasReadLastMessage(channel, client.user?.id)
      );
    };

    const handleEvent = async (event: Event) => {
      const mainChannelUpdated = !event.message?.parent_id || event.message?.show_in_channel;
      // When the scrollToBottomButtonVisible is true, we need to manually update the channelUnreadState.
      if (scrollToBottomButtonVisible || channelUnreadState?.first_unread_message_id) {
        setChannelUnreadState((prev) => {
          const previousUnreadCount = prev?.unread_messages ?? 0;
          const previousLastMessage = getPreviousLastMessage(channel.state.messages, event.message);
          return {
            ...(prev || {}),
            last_read:
              prev?.last_read ??
              (previousUnreadCount === 0 && previousLastMessage?.created_at
                ? new Date(previousLastMessage.created_at)
                : new Date(0)), // not having information about the last read message means the whole channel is unread,
            unread_messages: previousUnreadCount + 1,
          };
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
    channelUnreadState?.first_unread_message_id,
    client.user?.id,
    markRead,
    scrollToBottomButtonVisible,
    setChannelUnreadState,
    threadList,
  ]);

  useEffect(() => {
    /**
     * Scroll down when
     * created_at timestamp of top message before update is lesser than created_at timestamp of top message after update - channel has resynced
     */
    const scrollToBottomIfNeeded = () => {
      if (!client || !channel || rawMessageList.length === 0) {
        return;
      }

      /**
       * Condition to check if a message is removed from MessageList.
       * Eg: This would happen when giphy search is cancelled, etc.
       * If such a case arises, we scroll to bottom.
       */
      const isMessageRemovedFromMessageList =
        messageListLengthAfterUpdate < messageListLengthBeforeUpdate.current;
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

    // TODO: Think about if this is really needed?
    if (threadList) {
      scrollToBottomIfNeeded();
    }

    messageListLengthBeforeUpdate.current = messageListLengthAfterUpdate;
    topMessageBeforeUpdate.current = topMessageAfterUpdate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadList, messageListLengthAfterUpdate, topMessageAfterUpdate?.id]);

  useEffect(() => {
    if (!processedMessageList.length) {
      return;
    }
    if (threadList) {
      setAutoscrollToRecent(true);
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
    setAutoscrollToRecent(!didMergeMessageSetsWithNoUpdates);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, processedMessageList, threadList]);

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

  // TODO: do not apply on RN 0.73 and above
  const shouldApplyAndroidWorkaround = inverted && Platform.OS === 'android';

  const renderItem = useCallback(
    ({ index, item: message }: { index: number; item: LocalMessage }) => {
      if (!channel || channel.disconnected || (!channel.initialized && !channel.offlineMode)) {
        return null;
      }

      const createdAtTimestamp = message.created_at && new Date(message.created_at).getTime();
      const lastReadTimestamp = channelUnreadState?.last_read.getTime();
      const isNewestMessage = index === 0;
      const isLastReadMessage =
        channelUnreadState?.last_read_message_id === message.id ||
        (!channelUnreadState?.unread_messages && createdAtTimestamp === lastReadTimestamp);
      const isMyMessage = message.user?.id === client.userID;

      const showUnreadSeparator =
        isLastReadMessage &&
        !isNewestMessage &&
        !isMyMessage &&
        // The `channelUnreadState?.first_unread_message_id` is here for sent messages unread label
        (!!channelUnreadState?.first_unread_message_id || !!channelUnreadState?.unread_messages);

      const showUnreadUnderlay = !!shouldShowUnreadUnderlay && showUnreadSeparator;

      const wrapMessageInTheme = client.userID === message.user?.id && !!myMessageTheme;
      const renderDateSeperator = dateSeparatorsRef.current[message.id] && (
        <InlineDateSeparator date={dateSeparatorsRef.current[message.id]} />
      );

      const renderMessage = (
        <Message
          goToMessage={goToMessage}
          groupStyles={messageGroupStylesRef.current[message.id] ?? []}
          isTargetedMessage={highlightedMessageId === message.id}
          lastReceivedId={
            lastReceivedId === message.id || message.quoted_message_id ? lastReceivedId : undefined
          }
          message={message}
          onThreadSelect={onThreadSelect}
          showUnreadUnderlay={showUnreadUnderlay}
          style={[messageContainer]}
          threadList={threadList}
        />
      );

      return (
        <View
          style={[shouldApplyAndroidWorkaround ? styles.invertAndroid : undefined]}
          testID={`message-list-item-${index}`}
        >
          {message.type === 'system' ? (
            <MessageSystem
              message={message}
              style={[{ paddingHorizontal: screenPadding }, messageContainer]}
            />
          ) : wrapMessageInTheme ? (
            <ThemeProvider mergedStyle={modifiedTheme}>
              <View testID={`message-list-item-${index}`}>
                {renderDateSeperator}
                {renderMessage}
              </View>
            </ThemeProvider>
          ) : (
            <View testID={`message-list-item-${index}`}>
              {renderDateSeperator}
              {renderMessage}
            </View>
          )}
          {showUnreadUnderlay && <InlineUnreadIndicator />}
        </View>
      );
    },
    [
      InlineDateSeparator,
      InlineUnreadIndicator,
      Message,
      MessageSystem,
      channel,
      channelUnreadState?.first_unread_message_id,
      channelUnreadState?.last_read,
      channelUnreadState?.last_read_message_id,
      channelUnreadState?.unread_messages,
      client.userID,
      dateSeparatorsRef,
      goToMessage,
      highlightedMessageId,
      lastReceivedId,
      messageContainer,
      messageGroupStylesRef,
      modifiedTheme,
      myMessageTheme,
      onThreadSelect,
      screenPadding,
      shouldApplyAndroidWorkaround,
      shouldShowUnreadUnderlay,
      threadList,
    ],
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
    // If onEndReached has already been called for given messageList length, then ignore.
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
    // Show scrollToBottom button once scroll position goes beyond 150.
    const isScrollAtBottom = offset <= 150;

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
  const onScrollToIndexFailedRef = useRef<FlatListProps<LocalMessage>['onScrollToIndexFailed']>(
    (info) => {
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
    },
  );

  const messagesWithImages =
    legacyImageViewerSwipeBehaviour &&
    processedMessageList.filter((message) => {
      const isMessageTypeDeleted = message.type === 'deleted';
      if (!isMessageTypeDeleted && message.attachments) {
        return message.attachments.some(
          (attachment) =>
            attachment.type === FileTypes.Image &&
            !attachment.title_link &&
            !attachment.og_scrape_url &&
            (attachment.image_url || attachment.thumb_url),
        );
      }
      return false;
    });

  /**
   * This is for the useEffect to run again in the case that a message
   * gets edited with more or the same number of images
   */
  const imageString =
    legacyImageViewerSwipeBehaviour &&
    messagesWithImages &&
    messagesWithImages
      .map((message) =>
        message.attachments
          ?.map((attachment) => attachment.image_url || attachment.thumb_url || '')
          .join(),
      )
      .join();

  const numberOfMessagesWithImages =
    legacyImageViewerSwipeBehaviour && messagesWithImages && messagesWithImages.length;
  const threadExists = !!thread;

  useEffect(() => {
    if (
      legacyImageViewerSwipeBehaviour &&
      isListActive &&
      ((threadList && thread) || (!threadList && !thread))
    ) {
      setMessages(messagesWithImages as LocalMessage[]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    imageString,
    isListActive,
    legacyImageViewerSwipeBehaviour,
    numberOfMessagesWithImages,
    threadExists,
    threadList,
  ]);

  const dismissImagePicker = useStableCallback(() => {
    if (selectedPicker) {
      setSelectedPicker(undefined);
      closePicker();
    }
  });

  const onScrollBeginDrag: ScrollViewProps['onScrollBeginDrag'] = useStableCallback((event) => {
    !hasMoved && selectedPicker && setHasMoved(true);
    onUserScrollEvent(event);
  });

  const onScrollEndDrag: ScrollViewProps['onScrollEndDrag'] = useStableCallback((event) => {
    hasMoved && selectedPicker && setHasMoved(false);
    onUserScrollEvent(event);
  });

  const refCallback = useStableCallback((ref: FlatListType<LocalMessage>) => {
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

  const ListFooterComponent = useCallback(
    () => (
      <View style={shouldApplyAndroidWorkaround ? styles.invertAndroid : undefined}>
        <FooterComponent />
      </View>
    ),
    [shouldApplyAndroidWorkaround, FooterComponent],
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View style={shouldApplyAndroidWorkaround ? styles.invertAndroid : undefined}>
        <HeaderComponent />
      </View>
    ),
    [shouldApplyAndroidWorkaround, HeaderComponent],
  );

  const ItemSeparatorComponent = additionalFlatListProps?.ItemSeparatorComponent;
  const WrappedItemSeparatorComponent = useCallback(
    () => (
      <View style={[shouldApplyAndroidWorkaround ? styles.invertAndroid : undefined]}>
        {ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
      </View>
    ),
    [ItemSeparatorComponent, shouldApplyAndroidWorkaround],
  );

  // We need to omit the style related props from the additionalFlatListProps and add them directly instead of spreading
  let additionalFlatListPropsExcludingStyle:
    | Omit<
        NonNullable<typeof additionalFlatListProps>,
        'style' | 'contentContainerStyle' | 'ItemSeparatorComponent'
      >
    | undefined;

  if (additionalFlatListProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentContainerStyle, ItemSeparatorComponent, style, ...rest } =
      additionalFlatListProps;
    additionalFlatListPropsExcludingStyle = rest;
  }

  const flatListStyle = useMemo(
    () => [
      styles.listContainer,
      listContainer,
      additionalFlatListProps?.style,
      shouldApplyAndroidWorkaround ? styles.invertAndroid : undefined,
    ],
    [additionalFlatListProps?.style, listContainer, shouldApplyAndroidWorkaround],
  );

  const flatListContentContainerStyle = useMemo(
    () => [
      styles.contentContainer,
      additionalFlatListProps?.contentContainerStyle,
      contentContainer,
    ],
    [additionalFlatListProps?.contentContainerStyle, contentContainer],
  );

  if (!FlatList) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: white_snow }, container]}>
        <LoadingIndicator listType='message' />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: white_snow }, container]}
      testID='message-flat-list-wrapper'
    >
      {/* Don't show the empty list indicator for Thread messages */}
      {processedMessageList.length === 0 && !thread ? (
        <View style={[styles.flex, { backgroundColor: white_snow }]} testID='empty-state'>
          {EmptyStateIndicator ? <EmptyStateIndicator listType='message' /> : null}
        </View>
      ) : (
        <FlatList
          contentContainerStyle={flatListContentContainerStyle}
          /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
          data={processedMessageList}
          extraData={disabled}
          inverted={shouldApplyAndroidWorkaround ? false : inverted}
          ItemSeparatorComponent={WrappedItemSeparatorComponent}
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
          onMomentumScrollEnd={onUserScrollEvent}
          onScroll={handleScroll}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          onScrollToIndexFailed={onScrollToIndexFailedRef.current}
          onTouchEnd={dismissImagePicker}
          onViewableItemsChanged={stableOnViewableItemsChanged}
          ref={refCallback}
          renderItem={renderItem}
          showsVerticalScrollIndicator={!shouldApplyAndroidWorkaround}
          style={flatListStyle}
          testID='message-flat-list'
          viewabilityConfig={flatListViewabilityConfig}
          {...additionalFlatListPropsExcludingStyle}
        />
      )}
      <View style={styles.stickyHeader}>
        {messageListLengthAfterUpdate && StickyHeader ? (
          <StickyHeader date={stickyHeaderDate} DateHeader={DateHeader} />
        ) : null}
      </View>
      {!disableTypingIndicator && TypingIndicator && (
        <TypingIndicatorContainer>
          <TypingIndicator />
        </TypingIndicatorContainer>
      )}
      <ScrollToBottomButton
        onPress={goToNewMessages}
        showNotification={scrollToBottomButtonVisible}
        unreadCount={threadList ? 0 : channel?.countUnread()}
      />
      <NetworkDownIndicator />
      {isUnreadNotificationOpen && !threadList ? (
        <UnreadMessagesNotification onCloseHandler={onUnreadNotificationClose} />
      ) : null}
    </View>
  );
};

export type MessageListProps = Partial<MessageListPropsWithContext>;

export const MessageList = (props: MessageListProps) => {
  const { closePicker, selectedPicker, setSelectedPicker } = useAttachmentPickerContext();
  const {
    channel,
    channelUnreadState,
    disabled,
    EmptyStateIndicator,
    enableMessageGroupingByUser,
    error,
    hideStickyDateHeader,
    highlightedMessageId,
    isChannelActive,
    loadChannelAroundMessage,
    loading,
    LoadingIndicator,
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
  const { setMessages } = useImageGalleryContext();
  const {
    DateHeader,
    disableTypingIndicator,
    FlatList,
    InlineDateSeparator,
    InlineUnreadIndicator,
    legacyImageViewerSwipeBehaviour,
    Message,
    MessageSystem,
    myMessageTheme,
    ScrollToBottomButton,
    shouldShowUnreadUnderlay,
    TypingIndicator,
    TypingIndicatorContainer,
    UnreadMessagesNotification,
  } = useMessagesContext();
  const { loadMore, loadMoreRecent } = usePaginatedMessageListContext();
  const { loadMoreRecentThread, loadMoreThread, thread, threadInstance } = useThreadContext();

  return (
    <MessageListWithContext
      {...{
        channel,
        channelUnreadState,
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
        isListActive: isChannelActive,
        legacyImageViewerSwipeBehaviour,
        loadChannelAroundMessage,
        loading,
        LoadingIndicator,
        loadMore,
        loadMoreRecent,
        loadMoreRecentThread,
        loadMoreThread,
        markRead,
        Message,
        MessageSystem,
        myMessageTheme,
        NetworkDownIndicator,
        reloadChannel,
        ScrollToBottomButton,
        scrollToFirstUnreadThreshold,
        selectedPicker,
        setChannelUnreadState,
        setMessages,
        setSelectedPicker,
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
      }}
      {...props}
      noGroupByUser={!enableMessageGroupingByUser || props.noGroupByUser}
    />
  );
};
