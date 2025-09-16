import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollViewProps, StyleSheet, View, ViewabilityConfig, ViewToken } from 'react-native';

import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import type { Channel, Event, LocalMessage, MessageResponse } from 'stream-chat';

import { useMessageFlashList } from './hooks/useMessageFlashList';

import { useShouldScrollToRecentOnNewOwnMessageFlashList } from './hooks/useShouldScrollToRecentOnNewOwnMessageFlashList';
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
import { ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';

import { useStableCallback } from '../../hooks';
import { FileTypes } from '../../types/types';

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

type MessageListFlashListPropsWithContext = Pick<
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
    setFlatListRef?: (ref: FlashListRef<LocalMessage> | null) => void;
  };

const WAIT_FOR_SCROLL_TIMEOUT = 200;

const MessageListFlashListWithContext = (props: MessageListFlashListPropsWithContext) => {
  const LoadingMoreRecentIndicator = props.threadList
    ? InlineLoadingMoreRecentThreadIndicator
    : InlineLoadingMoreRecentIndicator;
  const {
    additionalFlashListProps,
    channel,
    channelUnreadState,
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
    highlightedMessageId,
    InlineDateSeparator,
    InlineUnreadIndicator,
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
  const flashListRef = useRef<FlashListRef<LocalMessage> | null>(null);

  const [hasMoved, setHasMoved] = useState(false);
  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);
  const [isUnreadNotificationOpen, setIsUnreadNotificationOpen] = useState<boolean>(false);
  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date | undefined>();
  const [autoScrollToRecent, setAutoScrollToRecent] = useState(false);

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

  const messageListLengthBeforeUpdate = useRef(0);
  const channelResyncScrollSet = useRef<boolean>(true);

  const {
    theme: {
      colors: { white_snow },
      messageList: { container, contentContainer, listContainer },
    },
  } = useTheme();

  const { dateSeparatorsRef, messageGroupStylesRef, processedMessageList, rawMessageList } =
    useMessageFlashList({
      noGroupByUser,
      threadList,
    });

  /**
   * We need topMessage and channelLastRead values to set the initial scroll position.
   * So these values only get used if `initialScrollToFirstUnreadMessage` prop is true.
   */
  const topMessageBeforeUpdate = useRef<LocalMessage>(undefined);
  const topMessageAfterUpdate: LocalMessage | undefined = rawMessageList[0];

  const latestNonCurrentMessageBeforeUpdateRef = useRef<LocalMessage>(undefined);

  const messageListLengthAfterUpdate = processedMessageList.length;

  const shouldScrollToRecentOnNewOwnMessageRef = useShouldScrollToRecentOnNewOwnMessageFlashList(
    rawMessageList,
    client.userID,
  );

  const lastReceivedId = useMemo(
    () => getLastReceivedMessage(processedMessageList)?.id,
    [processedMessageList],
  );

  const maintainVisibleContentPosition = useMemo(() => {
    console.log('autoScrollToRecent', autoScrollToRecent);
    return {
      autoscrollToBottomThreshold: autoScrollToRecent || threadList ? 10 : undefined,
      startRenderingFromBottom: true,
    };
  }, [autoScrollToRecent, threadList]);

  useEffect(() => {
    if (disabled) {
      setScrollToBottomButtonVisible(false);
    }
  }, [disabled]);

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
        if (!flashListRef.current) {
          return;
        }
        clearTimeout(scrollToDebounceTimeoutRef.current);

        // now scroll to it
        flashListRef.current.scrollToIndex({
          animated: true,
          index: indexOfParentInMessageList,
          viewPosition: 0.5,
        });
        setTargetedMessage(undefined);
      }, WAIT_FOR_SCROLL_TIMEOUT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetedMessage]);

  const goToMessage = useStableCallback(async (messageId: string) => {
    const indexOfParentInMessageList = processedMessageList.findIndex(
      (message) => message?.id === messageId,
    );
    if (indexOfParentInMessageList !== -1) {
      flashListRef.current?.scrollToIndex({
        animated: true,
        index: indexOfParentInMessageList,
        viewPosition: 0.5,
      });
      setTargetedMessage(messageId);
      return;
    }
    try {
      if (indexOfParentInMessageList === -1) {
        await loadChannelAroundMessage({ messageId });
        setTargetedMessage(messageId);

        setTimeout(() => {
          // now scroll to it with animated=true
          flashListRef.current?.scrollToIndex({
            animated: true,
            index: indexOfParentInMessageList,
            viewPosition: 0.5, // try to place message in the center of the screen
          });
        }, WAIT_FOR_SCROLL_TIMEOUT);
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
      messageListLengthAfterUpdate < messageListLengthBeforeUpdate.current;

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

        setAutoScrollToRecent(true);
        setTimeout(() => {
          channelResyncScrollSet.current = true;
          if (channel.countUnread() > 0) {
            markRead();
          }
        }, WAIT_FOR_SCROLL_TIMEOUT);
      }
    };

    if (isMessageRemovedFromMessageList) {
      scrollToBottomIfNeeded();
    }

    messageListLengthBeforeUpdate.current = messageListLengthAfterUpdate;
    topMessageBeforeUpdate.current = topMessageAfterUpdate;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageListLengthAfterUpdate, topMessageAfterUpdate?.id]);

  useEffect(() => {
    if (!processedMessageList.length) {
      return;
    }

    const notLatestSet = channel.state.messages !== channel.state.latestMessages;
    if (notLatestSet) {
      latestNonCurrentMessageBeforeUpdateRef.current =
        channel.state.latestMessages[channel.state.latestMessages.length - 1];
      setAutoScrollToRecent(false);
      setScrollToBottomButtonVisible(true);
      return;
    }
    const latestNonCurrentMessageBeforeUpdate = latestNonCurrentMessageBeforeUpdateRef.current;
    latestNonCurrentMessageBeforeUpdateRef.current = undefined;

    const latestCurrentMessageAfterUpdate = processedMessageList[processedMessageList.length - 1];
    if (!latestCurrentMessageAfterUpdate) {
      setAutoScrollToRecent(true);
      return;
    }
    const didMergeMessageSetsWithNoUpdates =
      latestNonCurrentMessageBeforeUpdate?.id === latestCurrentMessageAfterUpdate.id;

    // TODO: FIX THIS
    // setAutoScrollToRecent(!didMergeMessageSetsWithNoUpdates);

    if (!didMergeMessageSetsWithNoUpdates) {
      const shouldScrollToRecentOnNewOwnMessage = shouldScrollToRecentOnNewOwnMessageRef.current();

      // we should scroll to bottom where ever we are now
      // as we have sent a new own message
      if (shouldScrollToRecentOnNewOwnMessage) {
        setAutoScrollToRecent(true);
      }
    }
  }, [channel, processedMessageList, shouldScrollToRecentOnNewOwnMessageRef, threadList]);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (event.message?.user?.id === client.userID) {
        setAutoScrollToRecent(true);
      } else {
        if (!scrollToBottomButtonVisible) {
          setAutoScrollToRecent(true);
        } else {
          setAutoScrollToRecent(false);
        }
      }
    };
    const listener: ReturnType<typeof channel.on> = channel.on('message.new', handleEvent);

    return () => {
      listener?.unsubscribe();
    };
  }, [channel, client.userID, scrollToBottomButtonVisible]);

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
      const isMyOwnMessage = event.message?.user?.id === client.user?.id;
      // When the scrollToBottomButtonVisible is true, we need to manually update the channelUnreadState when its a received message.
      if (
        (scrollToBottomButtonVisible || channelUnreadState?.first_unread_message_id) &&
        !isMyOwnMessage
      ) {
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
    if (!viewableItems.length) {
      setIsUnreadNotificationOpen(false);
      return;
    }

    if (selectedPicker === 'images') {
      setIsUnreadNotificationOpen(false);
      return;
    }

    const lastItem = viewableItems[0];

    if (!lastItem) return;

    const lastItemMessage = lastItem.item;
    const lastItemCreatedAt = lastItemMessage.created_at;

    const unreadIndicatorDate = channelUnreadState?.last_read.getTime();
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

      const showUnreadSeparator =
        isLastReadMessage &&
        !isNewestMessage &&
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
          threadList={threadList}
        />
      );

      return (
        <View testID={`message-list-item-${index}`}>
          {message.type === 'system' ? (
            <MessageSystem message={message} />
          ) : wrapMessageInTheme ? (
            <ThemeProvider>
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
      messageGroupStylesRef,
      myMessageTheme,
      onThreadSelect,
      shouldShowUnreadUnderlay,
      threadList,
    ],
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
    if (!channel) {
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

  const handleScroll: ScrollViewProps['onScroll'] = useStableCallback((event) => {
    const messageListHasMessages = processedMessageList.length > 0;
    const nativeEvent = event.nativeEvent;
    const offset = nativeEvent.contentOffset.y;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;

    // Show scrollToBottom button once scroll position goes beyond 150.
    const isScrollAtStart = contentLength - visibleLength - offset < 150;

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
    () => ({ ...styles.listContainer, ...listContainer, ...additionalFlashListProps?.style }),
    [additionalFlashListProps?.style, listContainer],
  );

  const flatListContentContainerStyle = useMemo(
    () => ({
      ...styles.contentContainer,
      ...contentContainer,
    }),
    [contentContainer],
  );

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
      {processedMessageList.length === 0 && !thread ? (
        <View style={[styles.flex, { backgroundColor: white_snow }]} testID='empty-state'>
          {EmptyStateIndicator ? <EmptyStateIndicator listType='message' /> : null}
        </View>
      ) : (
        <FlashList
          contentContainerStyle={flatListContentContainerStyle}
          data={processedMessageList}
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
          showsVerticalScrollIndicator={false}
          style={flatListStyle}
          testID='message-flash-list'
          viewabilityConfig={flatListViewabilityConfig}
          {...additionalFlashListPropsExcludingStyle}
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

export type MessageListFlashListProps = Partial<MessageListFlashListPropsWithContext>;

export const MessageListFlashList = (props: MessageListFlashListProps) => {
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
    <MessageListFlashListWithContext
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
  listContainer: {
    flex: 1,
    width: '100%',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
  },
});
