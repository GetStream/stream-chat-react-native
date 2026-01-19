import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewabilityConfig,
  ViewToken,
} from 'react-native';

import Animated, { LinearTransition } from 'react-native-reanimated';

import type { FlashListProps, FlashListRef } from '@shopify/flash-list';
import type { Channel, Event, LocalMessage, MessageResponse } from 'stream-chat';

import { useMessageList } from './hooks/useMessageList';
import { useShouldScrollToRecentOnNewOwnMessage } from './hooks/useShouldScrollToRecentOnNewOwnMessage';
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
import {
  MessageInputHeightState,
  messageInputHeightStore,
} from '../../state-store/message-input-height-store';
import { MessageWrapper } from '../Message/MessageSimple/MessageWrapper';

let FlashList;

try {
  FlashList = require('@shopify/flash-list').FlashList;
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

type MessageFlashListPropsWithContext = Pick<
  AttachmentPickerContextValue,
  'closePicker' | 'selectedPicker' | 'setSelectedPicker'
> &
  Pick<OwnCapabilitiesContextValue, 'readEvents'> &
  Pick<
    ChannelContextValue,
    | 'channel'
    | 'channelUnreadStateStore'
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
    | 'maximumMessageLimit'
  > &
  Pick<ChatContextValue, 'client'> &
  Pick<MessageInputContextValue, 'messageInputFloating'> &
  Pick<PaginatedMessageListContextValue, 'loadMore' | 'loadMoreRecent'> &
  Pick<
    MessagesContextValue,
    | 'DateHeader'
    | 'disableTypingIndicator'
    | 'FlatList'
    | 'InlineDateSeparator'
    | 'InlineUnreadIndicator'
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

const getItemTypeInternal = (message: LocalMessage) => {
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

const renderItem = ({ item: message }: { item: LocalMessage }) => {
  return <MessageWrapper message={message} />;
};

const MessageFlashListWithContext = (props: MessageFlashListPropsWithContext) => {
  const LoadingMoreRecentIndicator = props.threadList
    ? InlineLoadingMoreRecentThreadIndicator
    : InlineLoadingMoreRecentIndicator;
  const {
    additionalFlashListProps,
    channel,
    channelUnreadStateStore,
    client,
    closePicker,
    DateHeader,
    disabled,
    disableTypingIndicator,
    EmptyStateIndicator,
    // FlatList,
    FooterComponent = LoadingMoreRecentIndicator,
    HeaderComponent = InlineLoadingMoreIndicator,
    hideStickyDateHeader,
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
    myMessageTheme,
    readEvents,
    NetworkDownIndicator,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    reloadChannel,
    ScrollToBottomButton,
    selectedPicker,
    setChannelUnreadState,
    setFlatListRef,
    setSelectedPicker,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    thread,
    threadInstance,
    threadList = false,
    TypingIndicator,
    TypingIndicatorContainer,
    UnreadMessagesNotification,
  } = props;
  const flashListRef = useRef<FlashListRef<LocalMessage> | null>(null);

  const { height: messageInputHeight } = useStateStore(
    messageInputHeightStore,
    messageInputHeightStoreSelector,
  );

  const [hasMoved, setHasMoved] = useState(false);
  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);
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

  const {
    colors: { white_snow },
    messageList: {
      container,
      contentContainer,
      listContainer,
      scrollToBottomButtonContainer,
      stickyHeaderContainer,
      unreadMessagesNotificationContainer,
    },
  } = theme;

  const myMessageThemeString = useMemo(() => JSON.stringify(myMessageTheme), [myMessageTheme]);

  const modifiedTheme = useMemo(
    () => mergeThemes({ style: myMessageTheme, theme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myMessageThemeString, theme],
  );

  const {
    messageListPreviousAndNextMessageStore,
    processedMessageList,
    rawMessageList,
    viewabilityChangedCallback,
  } = useMessageList({
    isFlashList: true,
    isLiveStreaming,
    threadList,
  });

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
      flashListRef.current.scrollToEnd({
        animated: true,
      });
    }
  }, [autoscrollToRecent]);

  const maintainVisibleContentPosition = useMemo(() => {
    return {
      animateAutoscrollToBottom: true,
      autoscrollToBottomThreshold: autoscrollToRecent ? 1 : undefined,
      startRenderingFromBottom: true,
    };
  }, [autoscrollToRecent]);

  useEffect(() => {
    if (disabled) {
      setScrollToBottomButtonVisible(false);
    }
  }, [disabled]);

  const indexToScrollToRef = useRef<number | undefined>(undefined);

  const initialIndexToScrollTo = useMemo(() => {
    return targetedMessage
      ? processedMessageList.findIndex((message) => message?.id === targetedMessage)
      : -1;
  }, [processedMessageList, targetedMessage]);

  useEffect(() => {
    indexToScrollToRef.current = initialIndexToScrollTo;
  }, [initialIndexToScrollTo]);

  /**
   * Check if a messageId needs to be scrolled to after list loads, and scroll to it
   * Note: This effect fires on every list change with a small debounce so that scrolling isnt abrupted by an immediate rerender
   */
  useEffect(() => {
    if (!targetedMessage) {
      return;
    }

    const indexOfParentInMessageList = processedMessageList.findIndex(
      (message) => message?.id === targetedMessage,
    );

    // the message we want to scroll to has not been loaded in the state yet
    if (indexOfParentInMessageList === -1) {
      loadChannelAroundMessage({ messageId: targetedMessage, setTargetedMessage });
    } else {
      scrollToDebounceTimeoutRef.current = setTimeout(() => {
        clearTimeout(scrollToDebounceTimeoutRef.current);

        // now scroll to it
        flashListRef.current?.scrollToIndex({
          animated: true,
          index: indexOfParentInMessageList,
          viewPosition: 0.5,
        });
        setTargetedMessage(undefined);
      }, WAIT_FOR_SCROLL_TIMEOUT);
    }
  }, [loadChannelAroundMessage, processedMessageList, setTargetedMessage, targetedMessage]);

  const goToMessage = useStableCallback(async (messageId: string) => {
    const indexOfParentInMessageList = processedMessageList.findIndex(
      (message) => message?.id === messageId,
    );

    indexToScrollToRef.current = indexOfParentInMessageList;

    try {
      if (indexOfParentInMessageList === -1) {
        clearTimeout(scrollToDebounceTimeoutRef.current);
        await loadChannelAroundMessage({ messageId, setTargetedMessage });
      } else {
        setTargetedMessage(messageId);
      }
    } catch (e) {
      console.warn('Error while scrolling to message', e);
    }
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

    const notLatestSet = channel.state.messages !== channel.state.latestMessages;
    if (notLatestSet) {
      latestNonCurrentMessageBeforeUpdateRef.current =
        channel.state.latestMessages[channel.state.latestMessages.length - 1];
      setAutoscrollToRecent(false);
      setScrollToBottomButtonVisible(true);
      return;
    } else {
      indexToScrollToRef.current = undefined;
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

  const updateStickyHeaderDateIfNeeded = useStableCallback((viewableItems: ViewToken[]) => {
    if (!viewableItems.length) {
      return;
    }

    const lastItem = viewableItems[0];

    if (!lastItem) return;

    if (
      !channel.state.messagePagination.hasPrev &&
      processedMessageList[0].id === lastItem.item.id
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
    const lastReadMessageVisible = viewableItems.some((item) => item.item.id === lastReadMessageId);

    if (
      !viewableItems.length ||
      !readEvents ||
      lastReadMessageVisible ||
      selectedPicker === 'images'
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
      !channel.state.messagePagination.hasPrev &&
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
      messageListPreviousAndNextMessageStore,
      modifiedTheme,
      noGroupByUser,
      onThreadSelect,
      setNativeScrollability,
    }),
    [
      goToMessage,
      messageListPreviousAndNextMessageStore,
      modifiedTheme,
      noGroupByUser,
      onThreadSelect,
      setNativeScrollability,
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
      threadList && !!threadInstance && loadMoreRecentThread
        ? loadMoreRecentThread({})
        : loadMoreRecent()
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

    onEndReachedInPromise.current = (threadList ? loadMoreThread() : loadMore())
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

    const notLatestSet = channel.state.messages !== channel.state.latestMessages;

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
    const isNotLatestSet = channel.state.messages !== channel.state.latestMessages;

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
    () => [styles.listContainer, listContainer, additionalFlashListProps?.style],
    [additionalFlashListProps?.style, listContainer],
  );

  const flatListContentContainerStyle = useMemo(
    () => [
      styles.contentContainer,
      { paddingBottom: messageInputFloating ? messageInputHeight : 0 },
      contentContainer,
    ],
    [contentContainer, messageInputFloating, messageInputHeight],
  );

  const currentListHeightRef = useRef<number | undefined>(undefined);

  const onLayout = useStableCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    if (!currentListHeightRef.current) {
      currentListHeightRef.current = height;
      return;
    }

    const changedBy = currentListHeightRef.current - height;
    flashListRef.current?.scrollToOffset({
      offset: currentScrollOffsetRef.current + changedBy,
    });
    currentListHeightRef.current = height;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: white_snow }, container]}>
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
    <View
      onLayout={onLayout}
      style={[styles.container, { backgroundColor: white_snow }, container]}
      testID='message-flat-list-wrapper'
    >
      {processedMessageList.length === 0 && !thread ? (
        <View style={[styles.flex, { backgroundColor: white_snow }]} testID='empty-state'>
          {EmptyStateIndicator ? <EmptyStateIndicator listType='message' /> : null}
        </View>
      ) : (
        <MessageListItemProvider value={messageListItemContextValue}>
          <FlashList
            contentContainerStyle={flatListContentContainerStyle}
            data={processedMessageList}
            drawDistance={800}
            getItemType={getItemTypeInternal}
            initialScrollIndex={
              indexToScrollToRef.current === -1 ? undefined : indexToScrollToRef.current
            }
            keyboardShouldPersistTaps='handled'
            keyExtractor={keyExtractor}
            ListFooterComponent={FooterComponent}
            ListHeaderComponent={HeaderComponent}
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
          />
        </MessageListItemProvider>
      )}
      <View style={[styles.stickyHeaderContainer, stickyHeaderContainer]}>
        {messageListLengthAfterUpdate && StickyHeader ? (
          <StickyHeader date={stickyHeaderDate} DateHeader={DateHeader} />
        ) : null}
      </View>
      {!disableTypingIndicator && TypingIndicator && (
        <TypingIndicatorContainer>
          <TypingIndicator />
        </TypingIndicatorContainer>
      )}
      <Animated.View
        layout={LinearTransition.duration(200)}
        style={[
          styles.scrollToBottomButtonContainer,
          { bottom: messageInputFloating ? messageInputHeight + 8 : 8 },
          scrollToBottomButtonContainer,
        ]}
      >
        <ScrollToBottomButton
          onPress={goToNewMessages}
          showNotification={scrollToBottomButtonVisible}
          unreadCount={threadList ? 0 : channel?.countUnread()}
        />
      </Animated.View>
      <NetworkDownIndicator />
      {isUnreadNotificationOpen && !threadList ? (
        <View
          style={[styles.unreadMessagesNotificationContainer, unreadMessagesNotificationContainer]}
        >
          <UnreadMessagesNotification onCloseHandler={onUnreadNotificationClose} />
        </View>
      ) : null}
    </View>
  );
};

export type MessageFlashListProps = Partial<MessageFlashListPropsWithContext>;

/**
 * This is a @experimental component.
 * It is implemented using @shopify/flash-list package to optimize the performance of the MessageList component.
 * The implementation is experimental and is subject to change.
 * Please feel free to report any issues or suggestions.
 */
export const MessageFlashList = (props: MessageFlashListProps) => {
  const { closePicker, selectedPicker, setSelectedPicker } = useAttachmentPickerContext();
  const {
    channel,
    channelUnreadStateStore,
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
    maximumMessageLimit,
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
  const { loadMore, loadMoreRecent } = usePaginatedMessageListContext();
  const { loadMoreRecentThread, loadMoreThread, thread, threadInstance } = useThreadContext();
  const { readEvents } = useOwnCapabilitiesContext();
  const { messageInputFloating } = useMessageInputContext();

  return (
    <MessageFlashListWithContext
      {...{
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
        isListActive: isChannelActive,
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
        MessageSystem,
        myMessageTheme,
        NetworkDownIndicator,
        readEvents,
        reloadChannel,
        ScrollToBottomButton,
        scrollToFirstUnreadThreshold,
        selectedPicker,
        setChannelUnreadState,
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

const styles = StyleSheet.create({
  container: {
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
  listContainer: {
    flex: 1,
    width: '100%',
  },
  scrollToBottomButtonContainer: {
    bottom: 8,
    position: 'absolute',
    right: 24,
  },
  stickyHeaderContainer: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  unreadMessagesNotificationContainer: {
    alignSelf: 'center',
    position: 'absolute',
    top: 8,
  },
});
