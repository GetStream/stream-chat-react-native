import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatListProps,
  FlatList as FlatListType,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';

import {
  isMessageWithStylesReadByAndDateSeparator,
  MessageType,
  useMessageList,
} from './hooks/useMessageList';
import { InlineLoadingMoreIndicator } from './InlineLoadingMoreIndicator';
import { InlineLoadingMoreRecentIndicator } from './InlineLoadingMoreRecentIndicator';
import { InlineLoadingMoreThreadIndicator } from './InlineLoadingMoreThreadIndicator';
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
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import {
  PaginatedMessageListContextValue,
  usePaginatedMessageListContext,
} from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import { mergeThemes, ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { Channel as StreamChannel } from 'stream-chat';

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
  container: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    /**
     * paddingBottom is set to 4 to account for the default date
     * header and inline indicator alignment. The top margin is 8
     * on the header but 4 on the inline date, this adjusts the spacing
     * to allow the "first" inline date to align with the date header.
     */
    paddingBottom: 4,
  },
  flex: { flex: 1 },
  invert: { transform: [{ scaleY: -1 }] },
  listContainer: {
    flex: 1,
    width: '100%',
  },
  messagePadding: {
    paddingHorizontal: 8,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
  },
});

const keyExtractor = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  item: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
) =>
  item.id ||
  (item.created_at
    ? typeof item.created_at === 'string'
      ? item.created_at
      : item.created_at.toISOString()
    : Date.now().toString());

const flatListViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 1,
};

type MessageListPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Pick<AttachmentPickerContextValue, 'closePicker' | 'selectedPicker' | 'setSelectedPicker'> &
  Pick<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'channel'
    | 'disabled'
    | 'EmptyStateIndicator'
    | 'loadChannelAtMessage'
    | 'loading'
    | 'LoadingIndicator'
    | 'markRead'
    | 'NetworkDownIndicator'
    | 'reloadChannel'
    | 'scrollToFirstUnreadThreshold'
    | 'setTargetedMessage'
    | 'StickyHeader'
    | 'targetedMessage'
    | 'typingEventsEnabled'
  > &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client'> &
  Pick<ImageGalleryContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'setImages'> &
  Pick<
    PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'loadMore' | 'loadMoreRecent'
  > &
  Pick<OverlayContextValue, 'overlay'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'DateHeader'
    | 'disableTypingIndicator'
    | 'FlatList'
    | 'initialScrollToFirstUnreadMessage'
    | 'InlineDateSeparator'
    | 'InlineUnreadIndicator'
    | 'Message'
    | 'ScrollToBottomButton'
    | 'MessageSystem'
    | 'myMessageTheme'
    | 'TypingIndicator'
    | 'TypingIndicatorContainer'
  > &
  Pick<ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'loadMoreThread' | 'thread'> &
  Pick<TranslationContextValue, 't' | 'tDateTimeParser'> & {
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
    additionalFlatListProps?: Partial<FlatListProps<MessageType<At, Ch, Co, Ev, Me, Re, Us>>>;
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
    onThreadSelect?: (message: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread']) => void;
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
    setFlatListRef?: (ref: FlatListType<MessageType<At, Ch, Co, Ev, Me, Re, Us>> | null) => void;
    /**
     * Boolean whether or not the Messages in the MessageList are part of a Thread
     **/
    threadList?: boolean;
  };

/**
 * The message list component renders a list of messages. It consumes the following contexts:
 *
 * [ChannelContext](https://getstream.github.io/stream-chat-react-native/v3/#channelcontext)
 * [ChatContext](https://getstream.github.io/stream-chat-react-native/v3/#chatcontext)
 * [MessagesContext](https://getstream.github.io/stream-chat-react-native/v3/#messagescontext)
 * [ThreadContext](https://getstream.github.io/stream-chat-react-native/v3/#threadcontext)
 * [TranslationContext](https://getstream.github.io/stream-chat-react-native/v3/#translationcontext)
 */
const MessageListWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const LoadingMoreIndicator = props.threadList
    ? InlineLoadingMoreThreadIndicator
    : InlineLoadingMoreIndicator;
  const {
    additionalFlatListProps,
    channel,
    client,
    closePicker,
    DateHeader,
    disabled,
    disableTypingIndicator,
    EmptyStateIndicator,
    FlatList,
    FooterComponent = LoadingMoreIndicator,
    HeaderComponent = InlineLoadingMoreRecentIndicator,
    initialScrollToFirstUnreadMessage,
    InlineDateSeparator,
    InlineUnreadIndicator,
    inverted = true,
    isListActive = false,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    loadMore,
    loadMoreRecent,
    loadMoreThread,
    markRead,
    Message,
    MessageSystem,
    myMessageTheme,
    NetworkDownIndicator,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    overlay,
    reloadChannel,
    ScrollToBottomButton,
    scrollToFirstUnreadThreshold,
    selectedPicker,
    setFlatListRef,
    setImages,
    setSelectedPicker,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    tDateTimeParser,
    thread,
    threadList = false,
    typingEventsEnabled,
    TypingIndicator,
    TypingIndicatorContainer,
  } = props;

  const { theme } = useTheme();

  const {
    colors: { white_snow },
    messageList: { container, contentContainer, listContainer },
  } = theme;

  const modifiedTheme = useMemo(
    () => mergeThemes({ style: myMessageTheme, theme }),
    [myMessageTheme, theme],
  );

  const messageList = useMessageList<At, Ch, Co, Ev, Me, Re, Us>({
    inverted,
    noGroupByUser,
    threadList,
  });
  const messageListLengthBeforeUpdate = useRef(0);
  const messageListLengthAfterUpdate = messageList.length;

  /**
   * We need topMessage and channelLastRead values to set the initial scroll position.
   * So these values only get used if `initialScrollToFirstUnreadMessage` prop is true.
   */
  const topMessageBeforeUpdate = useRef<MessageType<At, Ch, Co, Ev, Me, Re, Us>>();
  const topMessageAfterUpdate = messageList[messageList.length - 1];

  const [autoscrollToTop, setAutoscrollToTop] = useState(false);

  /**
   * We want to call onEndReached and onStartReached only once, per content length.
   * We keep track of calls to these functions per content length, with following trackers.
   */
  const onStartReachedTracker = useRef<Record<number, boolean>>({});
  const onEndReachedTracker = useRef<Record<number, boolean>>({});

  const onStartReachedInPromise = useRef<Promise<void> | null>(null);
  const onEndReachedInPromise = useRef<Promise<void> | null>(null);

  const flatListRef = useRef<FlatListType<MessageType<At, Ch, Co, Ev, Me, Re, Us>> | null>(null);

  const initialScrollSet = useRef<boolean>(false);
  const channelResyncScrollSet = useRef<boolean>(true);

  const [hasMoved, setHasMoved] = useState(false);
  const [lastReceivedId, setLastReceivedId] = useState(getLastReceivedMessage(messageList)?.id);
  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);

  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date | undefined>();
  const stickyHeaderDateRef = useRef<Date | undefined>();
  /**
   * channel.lastRead throws error if the channel is not initialized.
   */
  const getLastReadSafely = () => (channel?.initialized ? channel.lastRead() : undefined);

  const channelLastRead = useRef(getLastReadSafely());

  const isUnreadMessage = (
    message: MessageType<At, Ch, Co, Ev, Me, Re, Us> | undefined,
    lastRead?: ReturnType<StreamChannel<At, Ch, Co, Ev, Me, Re, Us>['lastRead']>,
  ) => message && lastRead && message.created_at && lastRead < message.created_at;

  /**
   * If the top message in the list is unread, then we should scroll to top of the list.
   * This is to handle the case when entire message list is unread.
   * This scroll get set only on load, and never again.
   */
  const setInitialScrollIfNeeded = () => {
    // If the feature is disabled or initial scroll position is already set.
    if (!initialScrollToFirstUnreadMessage || initialScrollSet.current) {
      initialScrollSet.current = true;
      return;
    }
    if (isUnreadMessage(topMessageBeforeUpdate.current, channelLastRead.current)) {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd();
      }
      setTimeout(() => {
        initialScrollSet.current = true;
      }, 500);
    } else if (!initialScrollSet.current) {
      initialScrollSet.current = true;
    }
  };

  const updateStickyHeaderDateIfNeeded = (viewableItems: ViewToken[]) => {
    if (viewableItems.length) {
      const lastItem = viewableItems.pop() as {
        item: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
      };

      if (
        lastItem?.item?.created_at &&
        !lastItem.item.deleted_at &&
        typeof lastItem.item.created_at !== 'string' &&
        lastItem.item.created_at.toDateString() !== stickyHeaderDateRef.current?.toDateString()
      ) {
        stickyHeaderDateRef.current = lastItem.item.created_at;
        setStickyHeaderDate(lastItem.item.created_at);
      }
    }
  };

  /**
   * FlatList doesn't accept changeable function for onViewableItemsChanged prop.
   * Thus useRef.
   */
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] | undefined }) => {
      if (viewableItems) {
        updateStickyHeaderDateIfNeeded(viewableItems);
      }
      setInitialScrollIfNeeded();
    },
  );

  const resetPaginationTrackers = () => {
    onStartReachedTracker.current = {};
    onEndReachedTracker.current = {};
  };

  useEffect(() => {
    setScrollToBottomButtonVisible(false);
  }, [disabled]);

  useEffect(() => {
    if (!loading && channel && channel.countUnread() <= scrollToFirstUnreadThreshold) {
      markRead();
    }
  }, [loading]);

  useEffect(() => {
    const lastReceivedMessage = getLastReceivedMessage(messageList);

    const hasNewMessage = lastReceivedId !== lastReceivedMessage?.id;
    const isMyMessage = lastReceivedMessage?.user?.id === client.userID;

    setLastReceivedId(lastReceivedMessage?.id);

    /**
     * Scroll down when
     * 1. you send a new message to channel
     * 2. new message list is small than the one before update - channel has resynced
     * 3. created_at timestamp of top message before update is lesser than created_at timestamp of top message after update - channel has resynced
     */
    const scrollToBottomIfNeeded = () => {
      if (!client || !channel || messageList.length === 0) {
        return;
      }

      if (
        (hasNewMessage && isMyMessage) ||
        messageListLengthAfterUpdate < messageListLengthBeforeUpdate.current ||
        (topMessageBeforeUpdate.current?.created_at &&
          topMessageAfterUpdate?.created_at &&
          topMessageBeforeUpdate.current.created_at < topMessageAfterUpdate.created_at)
      ) {
        channelResyncScrollSet.current = false;
        setScrollToBottomButtonVisible(false);
        resetPaginationTrackers();

        setTimeout(
          () =>
            flatListRef.current?.scrollToOffset({
              offset: 0,
            }),
          50,
        );
        setTimeout(() => {
          channelResyncScrollSet.current = true;
          if (channel.countUnread() > 0) {
            markRead();
          }
        }, 500);
      }
    };

    if (threadList || channel?.state.isUpToDate) {
      scrollToBottomIfNeeded();
    } else if (!scrollToBottomButtonVisible) {
      setScrollToBottomButtonVisible(true);
    }

    if (
      !channel?.state.isUpToDate &&
      flatListRef.current &&
      messageListLengthBeforeUpdate.current === 0 &&
      messageListLengthAfterUpdate < 10
    ) {
      /**
       * Trigger onStartReached on first load, if messages are not enough to fill the screen.
       * This is important especially for android, where you can't overscroll.
       */
      maybeCallOnStartReached(10);
    }

    /**
     * channelLastRead and topMessage are only used for setting initial scroll.
     * So lets not set it if `initialScrollToFirstUnreadMessage` prop is false.
     * OR if the scroll is already set.
     */
    if (initialScrollToFirstUnreadMessage && !initialScrollSet.current) {
      channelLastRead.current = getLastReadSafely();
    }

    messageListLengthBeforeUpdate.current = messageListLengthAfterUpdate;
    topMessageBeforeUpdate.current = topMessageAfterUpdate;
  }, [messageListLengthAfterUpdate, topMessageAfterUpdate?.id]);

  useEffect(() => {
    if (!channel?.state.isUpToDate && autoscrollToTop) {
      setAutoscrollToTop(false);
    } else if (channel?.state.isUpToDate && !autoscrollToTop) {
      setAutoscrollToTop(true);
    }
  }, [messageListLengthAfterUpdate]);

  const renderItem = ({
    index,
    item: message,
  }: {
    index: number;
    item: MessageType<At, Ch, Co, Ev, Me, Re, Us>;
  }) => {
    if (!channel || !channel.initialized) return null;

    const lastRead = getLastReadSafely();

    const lastMessage = messageList?.[index + 1];

    const showUnreadUnderlay = !!isUnreadMessage(message, lastRead) && scrollToBottomButtonVisible;
    const insertInlineUnreadIndicator =
      showUnreadUnderlay && !isUnreadMessage(lastMessage, lastRead);

    if (message.type === 'system') {
      return (
        <>
          <MessageSystem message={message} style={styles.messagePadding} />
          {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
        </>
      );
    }

    const wrapMessageInTheme = client.userID === message.user?.id && !!myMessageTheme;
    return wrapMessageInTheme ? (
      <>
        <ThemeProvider mergedStyle={modifiedTheme}>
          <Message
            goToMessage={goToMessage}
            groupStyles={
              isMessageWithStylesReadByAndDateSeparator(message) ? message.groupStyles : []
            }
            lastReceivedId={lastReceivedId === message.id ? lastReceivedId : undefined}
            message={message}
            onThreadSelect={onThreadSelect}
            showUnreadUnderlay={showUnreadUnderlay}
            style={styles.messagePadding}
            targetedMessage={targetedMessage === message.id}
            threadList={threadList}
          />
        </ThemeProvider>
        {isMessageWithStylesReadByAndDateSeparator(message) && message.dateSeparator && (
          <InlineDateSeparator date={message.dateSeparator} />
        )}
        {/* Adding indicator below the messages, since the list is inverted */}
        {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
      </>
    ) : (
      <>
        <Message
          goToMessage={goToMessage}
          groupStyles={
            isMessageWithStylesReadByAndDateSeparator(message) ? message.groupStyles : []
          }
          lastReceivedId={
            lastReceivedId === message.id || message.quoted_message_id ? lastReceivedId : undefined
          }
          message={message}
          onThreadSelect={onThreadSelect}
          showUnreadUnderlay={showUnreadUnderlay}
          style={styles.messagePadding}
          targetedMessage={targetedMessage === message.id}
          threadList={threadList}
        />
        {isMessageWithStylesReadByAndDateSeparator(message) && message.dateSeparator && (
          <InlineDateSeparator date={message.dateSeparator} />
        )}
        {/* Adding indicator below the messages, since the list is inverted */}
        {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
      </>
    );
  };

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
  const maybeCallOnStartReached = (limit?: number) => {
    // If onStartReached has already been called for given data length, then ignore.
    if (messageList?.length && onStartReachedTracker.current[messageList.length]) {
      return;
    }

    if (messageList?.length) {
      onStartReachedTracker.current[messageList.length] = true;
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
      onEndReachedInPromise.current.finally(() => {
        onStartReachedInPromise.current = loadMoreRecent(limit).then(callback).catch(onError);
      });
    } else {
      onStartReachedInPromise.current = loadMoreRecent(limit).then(callback).catch(onError);
    }
  };

  /**
   * 1. Makes a call to `loadMore` function, which queries more older messages.
   * 2. Ensures that we call `loadMore`, once per content length
   * 3. If the call to `loadMoreRecent` is in progress, we wait for it to finish to make sure scroll doesn't jump.
   */
  const maybeCallOnEndReached = () => {
    // If onEndReached has already been called for given messageList length, then ignore.
    if (messageList?.length && onEndReachedTracker.current[messageList.length]) {
      return;
    }

    if (messageList?.length) {
      onEndReachedTracker.current[messageList.length] = true;
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
      onStartReachedInPromise.current.finally(() => {
        onEndReachedInPromise.current = (threadList ? loadMoreThread() : loadMore())
          .then(callback)
          .catch(onError);
      });
    } else {
      onEndReachedInPromise.current = (threadList ? loadMoreThread() : loadMore())
        .then(callback)
        .catch(onError);
    }
  };

  /**
   * Following if condition covers following cases:
   * 1. If I scroll up -> show scrollToBottom button.
   * 2. If I scroll to bottom of screen
   *    |-> hide scrollToBottom button.
   *    |-> if channel is unread, call markRead().
   */
  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    if (!channel || !initialScrollSet.current || !channelResyncScrollSet.current) {
      return;
    }

    const offset = event.nativeEvent.contentOffset.y;
    const visibleLength = event.nativeEvent.layoutMeasurement.height;
    const contentLength = event.nativeEvent.contentSize.height;
    // Check if scroll has reached either start of end of list.
    const isScrollAtStart = offset < 100;
    const isScrollAtEnd = contentLength - visibleLength - offset < 100;

    if (isScrollAtStart) {
      maybeCallOnStartReached();
    }

    if (isScrollAtEnd) {
      maybeCallOnEndReached();
    }

    // Show scrollToBottom button once scroll position goes beyond 300.
    const isScrollAtBottom = offset <= 300;
    const showScrollToBottomButton = !isScrollAtBottom || !channel?.state.isUpToDate;

    const shouldMarkRead =
      !threadList && offset <= 0 && channel?.state.isUpToDate && channel.countUnread() > 0;

    if (shouldMarkRead) {
      markRead();
    }

    if (showScrollToBottomButton && !scrollToBottomButtonVisible) {
      setScrollToBottomButtonVisible(true);
    } else if (!showScrollToBottomButton && scrollToBottomButtonVisible) {
      setScrollToBottomButtonVisible(false);
    }

    if (onListScroll) {
      onListScroll(event);
    }
  };

  const goToNewMessages = async () => {
    if (!channel?.state.isUpToDate) {
      resetPaginationTrackers();

      await reloadChannel();
    } else if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: 0,
      });
    }

    setScrollToBottomButtonVisible(false);
    if (!threadList) {
      markRead();
    }
  };

  const goToMessage = useCallback(
    (messageId: string) => {
      const indexOfParentInMessageList = messageList.findIndex(
        (message) => message?.id === messageId,
      );

      if (indexOfParentInMessageList > -1) {
        try {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: indexOfParentInMessageList,
              viewPosition: 0.5,
            });
            setTargetedMessage(messageId);

            return;
          }
        } catch (_) {
          // do nothing;
        }
      }

      loadChannelAtMessage({ messageId });
      resetPaginationTrackers();
    },
    [messageListLengthAfterUpdate],
  );

  const messagesWithImages = messageList.filter((message) => {
    if (!message.deleted_at && message.attachments) {
      return message.attachments.some(
        (attachment) =>
          attachment.type === 'image' &&
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
  const imageString = messagesWithImages
    .map((message) =>
      message.attachments
        ?.map((attachment) => attachment.image_url || attachment.thumb_url || '')
        .join(),
    )
    .join();

  const numberOfMessagesWithImages = messagesWithImages.length;
  const threadExists = !!thread;
  useEffect(() => {
    if (isListActive && ((threadList && thread) || (!threadList && !thread))) {
      setImages(messagesWithImages);
    }
  }, [imageString, numberOfMessagesWithImages, threadExists, threadList, isListActive]);

  const stickyHeaderFormatDate =
    stickyHeaderDate?.getFullYear() === new Date().getFullYear() ? 'MMM D' : 'MMM D, YYYY';
  const tStickyHeaderDate = stickyHeaderDate ? tDateTimeParser(stickyHeaderDate) : null;
  const stickyHeaderDateToRender =
    tStickyHeaderDate === null
      ? null
      : isDayOrMoment(tStickyHeaderDate)
      ? tStickyHeaderDate.format(stickyHeaderFormatDate)
      : new Date(tStickyHeaderDate).toDateString();

  const dismissImagePicker = () => {
    if (!hasMoved && selectedPicker) {
      setSelectedPicker(undefined);
      closePicker();
    }
  };
  const onScrollBeginDrag = () => !hasMoved && selectedPicker && setHasMoved(true);
  const onScrollEndDrag = () => hasMoved && selectedPicker && setHasMoved(false);

  const refCallback = (ref: FlatListType<MessageType<At, Ch, Co, Ev, Me, Re, Us>>) => {
    flatListRef.current = ref;

    if (setFlatListRef) {
      setFlatListRef(ref);
    }
  };
  const renderListEmptyComponent = () => (
    <View style={[styles.flex, styles.invert]} testID='empty-state'>
      <EmptyStateIndicator listType='message' />
    </View>
  );

  if (!FlatList) return null;

  if (loading) {
    return (
      <View style={styles.flex}>
        <LoadingIndicator listType='message' />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: white_snow }, container]}>
      <FlatList
        contentContainerStyle={[styles.contentContainer, contentContainer]}
        data={messageList}
        /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
        extraData={disabled || !channel?.state.isUpToDate}
        inverted={inverted}
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderListEmptyComponent}
        ListFooterComponent={FooterComponent}
        ListHeaderComponent={HeaderComponent}
        maintainVisibleContentPosition={{
          autoscrollToTopThreshold: autoscrollToTop ? 10 : undefined,
          minIndexForVisible: 1,
        }}
        onScroll={handleScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onTouchEnd={dismissImagePicker}
        onViewableItemsChanged={onViewableItemsChanged.current}
        ref={refCallback}
        renderItem={renderItem}
        scrollEnabled={overlay === 'none'}
        style={[styles.listContainer, listContainer]}
        testID='message-flat-list'
        viewabilityConfig={flatListViewabilityConfig}
        {...additionalFlatListProps}
      />
      {!loading && (
        <>
          <View style={styles.stickyHeader}>
            {stickyHeaderDateToRender &&
              (StickyHeader ? (
                <StickyHeader dateString={stickyHeaderDateToRender} />
              ) : messageListLengthAfterUpdate ? (
                <DateHeader dateString={stickyHeaderDateToRender} />
              ) : null)}
          </View>
          {!disableTypingIndicator && TypingIndicator && typingEventsEnabled !== false && (
            <TypingIndicatorContainer>
              <TypingIndicator />
            </TypingIndicatorContainer>
          )}
          <ScrollToBottomButton
            onPress={goToNewMessages}
            showNotification={scrollToBottomButtonVisible}
            unreadCount={threadList ? 0 : channel?.countUnread()}
          />
        </>
      )}
      <NetworkDownIndicator />
    </View>
  );
};

export type MessageListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = Partial<MessageListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  props: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { closePicker, selectedPicker, setSelectedPicker } = useAttachmentPickerContext();
  const {
    channel,
    disabled,
    EmptyStateIndicator,
    error,
    isChannelActive,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    markRead,
    NetworkDownIndicator,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    typingEventsEnabled,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setImages } = useImageGalleryContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    DateHeader,
    disableTypingIndicator,
    FlatList,
    initialScrollToFirstUnreadMessage,
    InlineDateSeparator,
    InlineUnreadIndicator,
    Message,
    MessageSystem,
    myMessageTheme,
    ScrollToBottomButton,
    TypingIndicator,
    TypingIndicatorContainer,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { loadMore, loadMoreRecent } = usePaginatedMessageListContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { overlay } = useOverlayContext();
  const { loadMoreThread, thread } = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t, tDateTimeParser } = useTranslationContext();

  return (
    <MessageListWithContext
      {...{
        channel,
        client,
        closePicker,
        DateHeader,
        disabled,
        disableTypingIndicator,
        EmptyStateIndicator,
        error,
        FlatList,
        initialScrollToFirstUnreadMessage,
        InlineDateSeparator,
        InlineUnreadIndicator,
        isListActive: isChannelActive,
        loadChannelAtMessage,
        loading,
        LoadingIndicator,
        loadMore,
        loadMoreRecent,
        loadMoreThread,
        markRead,
        Message,
        MessageSystem,
        myMessageTheme,
        NetworkDownIndicator,
        overlay,
        reloadChannel,
        ScrollToBottomButton,
        scrollToFirstUnreadThreshold,
        selectedPicker,
        setImages,
        setSelectedPicker,
        setTargetedMessage,
        StickyHeader,
        t,
        targetedMessage,
        tDateTimeParser,
        thread,
        typingEventsEnabled,
        TypingIndicator,
        TypingIndicatorContainer,
      }}
      {...props}
    />
  );
};
