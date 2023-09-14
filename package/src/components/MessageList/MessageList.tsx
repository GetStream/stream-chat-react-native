import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatListProps,
  FlatList as FlatListType,
  Platform,
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
  OverlayContextValue,
  useOverlayContext,
} from '../../contexts/overlayContext/OverlayContext';
import {
  PaginatedMessageListContextValue,
  usePaginatedMessageListContext,
} from '../../contexts/paginatedMessageListContext/PaginatedMessageListContext';
import { mergeThemes, ThemeProvider, useTheme } from '../../contexts/themeContext/ThemeContext';
import { ThreadContextValue, useThreadContext } from '../../contexts/threadContext/ThreadContext';
import {
  isDayOrMoment,
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

const WAIT_FOR_SCROLL_TO_OFFSET_TIMEOUT = 150;
const MAX_RETRIES_AFTER_SCROLL_FAILURE = 10;
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

const InvertedCellRendererComponent = (props: React.PropsWithChildren<unknown>) => (
  <View {...props} style={styles.invertAndroid} />
);

const keyExtractor = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  item: MessageType<StreamChatGenerics>,
) => {
  if (item.id) return item.id;
  if (item.created_at)
    return typeof item.created_at === 'string' ? item.created_at : item.created_at.toISOString();
  return Date.now().toString();
};

const flatListViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 1,
};

type MessageListPropsWithContext<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<AttachmentPickerContextValue, 'closePicker' | 'selectedPicker' | 'setSelectedPicker'> &
  Pick<
    ChannelContextValue<StreamChatGenerics>,
    | 'channel'
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
    | 'setTargetedMessage'
    | 'StickyHeader'
    | 'targetedMessage'
  > &
  Pick<ChatContextValue<StreamChatGenerics>, 'client'> &
  Pick<ImageGalleryContextValue<StreamChatGenerics>, 'setMessages'> &
  Pick<
    PaginatedMessageListContextValue<StreamChatGenerics>,
    'hasNoMoreRecentMessagesToLoad' | 'loadMore' | 'loadMoreRecent'
  > &
  Pick<OverlayContextValue, 'overlay'> &
  Pick<
    MessagesContextValue<StreamChatGenerics>,
    | 'DateHeader'
    | 'disableTypingIndicator'
    | 'FlatList'
    | 'initialScrollToFirstUnreadMessage'
    | 'InlineDateSeparator'
    | 'InlineUnreadIndicator'
    | 'legacyImageViewerSwipeBehaviour'
    | 'Message'
    | 'ScrollToBottomButton'
    | 'MessageSystem'
    | 'myMessageTheme'
    | 'TypingIndicator'
    | 'TypingIndicatorContainer'
  > &
  Pick<ThreadContextValue<StreamChatGenerics>, 'loadMoreThread' | 'thread'> &
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
    additionalFlatListProps?: Partial<FlatListProps<MessageType<StreamChatGenerics>>>;
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
    onThreadSelect?: (message: ThreadContextValue<StreamChatGenerics>['thread']) => void;
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
    setFlatListRef?: (ref: FlatListType<MessageType<StreamChatGenerics>> | null) => void;
    /**
     * Boolean whether or not the Messages in the MessageList are part of a Thread
     **/
    threadList?: boolean;
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
const MessageListWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageListPropsWithContext<StreamChatGenerics>,
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
    hasNoMoreRecentMessagesToLoad,
    HeaderComponent = InlineLoadingMoreRecentIndicator,
    hideStickyDateHeader,
    initialScrollToFirstUnreadMessage,
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
    selectedPicker,
    setFlatListRef,
    setMessages,
    setSelectedPicker,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    tDateTimeParser,
    thread,
    threadList = false,
    TypingIndicator,
    TypingIndicatorContainer,
  } = props;

  const { theme } = useTheme();

  const {
    colors: { white_snow },
    messageList: { container, contentContainer, listContainer, messageContainer },
    screenPadding,
  } = theme;

  const modifiedTheme = useMemo(
    () => mergeThemes({ style: myMessageTheme, theme }),
    [myMessageTheme, theme],
  );

  const messageList = useMessageList<StreamChatGenerics>({
    noGroupByUser,
    threadList,
  });
  const messageListLengthBeforeUpdate = useRef(0);
  const messageListLengthAfterUpdate = messageList.length;

  /**
   * We need topMessage and channelLastRead values to set the initial scroll position.
   * So these values only get used if `initialScrollToFirstUnreadMessage` prop is true.
   */
  const topMessageBeforeUpdate = useRef<MessageType<StreamChatGenerics>>();
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

  const flatListRef = useRef<FlatListType<MessageType<StreamChatGenerics>> | null>(null);

  /**
   * Flag to track if the initial scroll has been set
   * If the prop `initialScrollToFirstUnreadMessage` was enabled, then we scroll to the unread msg and set it to true
   * If not, the default offset of 0 for flatList means that it has been set already
   */
  const [isInitialScrollDone, setInitialScrollDone] = useState(!initialScrollToFirstUnreadMessage);
  const channelResyncScrollSet = useRef<boolean>(true);

  /**
   * The timeout id used to debounce our scrollToIndex calls on messageList updates
   */
  const scrollToDebounceTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * The timeout id used to lazier load the initial scroll set flag
   */
  const initialScrollSettingTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * If a messageId was requested to scroll to but was unloaded,
   * this flag keeps track of it to scroll to it after loading the message
   */
  const messageIdToScrollToRef = useRef<string>();
  /**
   * Last messageID that was scrolled to after loading a new message list,
   * this flag keeps track of it so that we dont scroll to it again on target message set
   */
  const messageIdLastScrolledToRef = useRef<string>();
  const [hasMoved, setHasMoved] = useState(false);
  const [lastReceivedId, setLastReceivedId] = useState(getLastReceivedMessage(messageList)?.id);
  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);

  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date | undefined>();
  const stickyHeaderDateRef = useRef<Date | undefined>();

  // ref for channel to use in useEffect without triggering it on channel change
  const channelRef = useRef(channel);
  channelRef.current = channel;

  const updateStickyHeaderDateIfNeeded = (viewableItems: ViewToken[]) => {
    if (viewableItems.length) {
      const lastItem = viewableItems.pop() as {
        item: MessageType<StreamChatGenerics>;
      };

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
  };

  /**
   * FlatList doesn't accept changeable function for onViewableItemsChanged prop.
   * Thus useRef.
   */
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] | undefined }) => {
      /**
       * When a new message comes in, list scrolls down to the bottom automatically (using prop `maintainVisibleContentPosition`)
       * and we mark the channel as read from handleScroll function.
       * Although this logic is dependent on the fact that `onScroll` event gets triggered during this process.
       * But for Android, this event is not triggered when messages length is lesser than visible screen height.
       *
       * And thus we need to check if the message list length is lesser than visible screen height and mark the channel as read.
       */
      if (
        Platform.OS === 'android' &&
        viewableItems?.length &&
        viewableItems?.length >= messageListLengthBeforeUpdate.current
      ) {
        channel.markRead();
      }

      if (viewableItems && !hideStickyDateHeader) {
        updateStickyHeaderDateIfNeeded(viewableItems);
      }
    },
  );

  /**
   * Resets the pagination trackers, doing so cancels currently scheduled loading more calls
   */
  const resetPaginationTrackersRef = useRef(() => {
    onStartReachedTracker.current = {};
    onEndReachedTracker.current = {};
  });

  useEffect(() => {
    setScrollToBottomButtonVisible(false);
  }, [disabled]);

  useEffect(() => {
    const getShouldMarkReadAutomatically = (): boolean => {
      if (loading || !channel) {
        // nothing to do
        return false;
      } else if (channel.countUnread() > 0) {
        if (!initialScrollToFirstUnreadMessage) {
          /*
           * In this case MessageList won't scroll to first unread message when opened, so we can mark
           * the channel as read right after opening.
           * */
          return true;
        } else {
          /*
           * In this case MessageList will be opened to first unread message.
           * But if there are were not enough unread messages, so that scrollToBottom button was not shown
           * then MessageList won't need to scroll up. So we can safely mark the channel as read right after opening.
           *
           * NOTE: we must ensure that initial scroll is done, otherwise we do not wait till the unread scroll is finished
           * */
          if (scrollToBottomButtonVisible) return false;
          /* if scrollToBottom button was not visible, wait till
           * - initial scroll is done (indicates that if scrolling to index was needed it was triggered)
           * */
          return isInitialScrollDone;
        }
      }
      return false;
    };

    if (getShouldMarkReadAutomatically()) {
      markRead();
    }
  }, [loading, scrollToBottomButtonVisible, isInitialScrollDone]);

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
        resetPaginationTrackersRef.current();

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: 0,
          });
        }, 50);
        setTimeout(() => {
          channelResyncScrollSet.current = true;
          if (channel.countUnread() > 0) {
            markRead();
          }
        }, 500);
      }
    };

    if (threadList || hasNoMoreRecentMessagesToLoad) {
      scrollToBottomIfNeeded();
    } else {
      setScrollToBottomButtonVisible(true);
    }

    if (
      !hasNoMoreRecentMessagesToLoad &&
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

    messageListLengthBeforeUpdate.current = messageListLengthAfterUpdate;
    topMessageBeforeUpdate.current = topMessageAfterUpdate;
  }, [messageListLengthAfterUpdate, topMessageAfterUpdate?.id]);

  useEffect(() => {
    setAutoscrollToTop(hasNoMoreRecentMessagesToLoad);
  }, [messageList, hasNoMoreRecentMessagesToLoad]);

  const shouldApplyAndroidWorkaround = inverted && Platform.OS === 'android';

  const renderItem = ({
    index,
    item: message,
  }: {
    index: number;
    item: MessageType<StreamChatGenerics>;
  }) => {
    if (!channel || channel.disconnected || (!channel.initialized && !channel.offlineMode))
      return null;

    const lastRead = channel.lastRead();

    function isMessageUnread(messageArrayIndex: number): boolean {
      const msg = messageList?.[messageArrayIndex];
      if (lastRead && msg?.created_at) {
        return lastRead < msg.created_at;
      }
      return false;
    }

    const isCurrentMessageUnread = isMessageUnread(index);
    const showUnreadUnderlay =
      !channel.muteStatus().muted && isCurrentMessageUnread && scrollToBottomButtonVisible;
    const insertInlineUnreadIndicator = showUnreadUnderlay && !isMessageUnread(index + 1); // show only if previous message is read

    if (message.type === 'system') {
      return (
        <>
          <View testID={`message-list-item-${index}`}>
            <MessageSystem
              message={message}
              style={[{ paddingHorizontal: screenPadding }, messageContainer]}
            />
          </View>
          {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
        </>
      );
    }

    const wrapMessageInTheme = client.userID === message.user?.id && !!myMessageTheme;
    return wrapMessageInTheme ? (
      <>
        {shouldApplyAndroidWorkaround &&
          isMessageWithStylesReadByAndDateSeparator(message) &&
          message.dateSeparator && <InlineDateSeparator date={message.dateSeparator} />}
        <ThemeProvider mergedStyle={modifiedTheme}>
          <View testID={`message-list-item-${index}`}>
            <Message
              goToMessage={goToMessage}
              groupStyles={
                isMessageWithStylesReadByAndDateSeparator(message) ? message.groupStyles : []
              }
              isTargetedMessage={targetedMessage === message.id}
              lastReceivedId={lastReceivedId === message.id ? lastReceivedId : undefined}
              message={message}
              onThreadSelect={onThreadSelect}
              showUnreadUnderlay={showUnreadUnderlay}
              style={[{ paddingHorizontal: screenPadding }, messageContainer]}
              threadList={threadList}
            />
          </View>
        </ThemeProvider>
        {!shouldApplyAndroidWorkaround &&
          isMessageWithStylesReadByAndDateSeparator(message) &&
          message.dateSeparator && <InlineDateSeparator date={message.dateSeparator} />}
        {/* Adding indicator below the messages, since the list is inverted */}
        {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
      </>
    ) : (
      <>
        <View testID={`message-list-item-${index}`}>
          {shouldApplyAndroidWorkaround &&
            isMessageWithStylesReadByAndDateSeparator(message) &&
            message.dateSeparator && <InlineDateSeparator date={message.dateSeparator} />}
          <Message
            goToMessage={goToMessage}
            groupStyles={
              isMessageWithStylesReadByAndDateSeparator(message) ? message.groupStyles : []
            }
            isTargetedMessage={targetedMessage === message.id}
            lastReceivedId={
              lastReceivedId === message.id || message.quoted_message_id
                ? lastReceivedId
                : undefined
            }
            message={message}
            onThreadSelect={onThreadSelect}
            showUnreadUnderlay={showUnreadUnderlay}
            style={[{ paddingHorizontal: screenPadding }, messageContainer]}
            threadList={threadList}
          />
        </View>
        {!shouldApplyAndroidWorkaround &&
          isMessageWithStylesReadByAndDateSeparator(message) &&
          message.dateSeparator && <InlineDateSeparator date={message.dateSeparator} />}
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
  const maybeCallOnStartReached = async (limit?: number) => {
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
      await onEndReachedInPromise.current;
      onStartReachedInPromise.current = loadMoreRecent(limit).then(callback).catch(onError);
    } else {
      onStartReachedInPromise.current = loadMoreRecent(limit).then(callback).catch(onError);
    }
  };

  /**
   * 1. Makes a call to `loadMore` function, which queries more older messages.
   * 2. Ensures that we call `loadMore`, once per content length
   * 3. If the call to `loadMoreRecent` is in progress, we wait for it to finish to make sure scroll doesn't jump.
   */
  const maybeCallOnEndReached = async () => {
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
      await onStartReachedInPromise.current;
      onEndReachedInPromise.current = (threadList ? loadMoreThread() : loadMore())
        .then(callback)
        .catch(onError);
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
    if (!channel || !channelResyncScrollSet.current) {
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

    // Show scrollToBottom button once scroll position goes beyond 150.
    const isScrollAtBottom = offset <= 150;
    const showScrollToBottomButton = !isScrollAtBottom || !hasNoMoreRecentMessagesToLoad;

    const shouldMarkRead =
      !threadList && offset <= 0 && hasNoMoreRecentMessagesToLoad && channel.countUnread() > 0;

    if (shouldMarkRead) {
      markRead();
    }

    setScrollToBottomButtonVisible(showScrollToBottomButton);

    if (onListScroll) {
      onListScroll(event);
    }
  };

  const goToNewMessages = async () => {
    if (!hasNoMoreRecentMessagesToLoad) {
      resetPaginationTrackersRef.current();
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

  const scrollToIndexFailedRetryCountRef = useRef<number>(0);
  const failScrollTimeoutId = useRef<NodeJS.Timeout>();
  const onScrollToIndexFailedRef = useRef<
    FlatListProps<MessageType<StreamChatGenerics>>['onScrollToIndexFailed']
  >((info) => {
    // We got a failure as we tried to scroll to an item that was outside the render length
    if (!flatListRef.current) return;
    // we don't know the actual size of all items but we can see the average, so scroll to the closest offset
    flatListRef.current.scrollToOffset({
      animated: false,
      offset: info.averageItemLength * info.index,
    });
    // since we used only an average offset... we won't go to the center of the item yet
    // with a little delay to wait for scroll to offset to complete, we can then scroll to the index
    failScrollTimeoutId.current = setTimeout(() => {
      try {
        flatListRef.current?.scrollToIndex({
          animated: false,
          index: info.index,
          viewPosition: 0.5, // try to place message in the center of the screen
        });
        if (messageIdLastScrolledToRef.current) {
          setTargetedMessage(messageIdLastScrolledToRef.current);
        }
        scrollToIndexFailedRetryCountRef.current = 0;
      } catch (e) {
        if (
          !onScrollToIndexFailedRef.current ||
          scrollToIndexFailedRetryCountRef.current > MAX_RETRIES_AFTER_SCROLL_FAILURE
        ) {
          console.log(
            `Scrolling to index failed after ${MAX_RETRIES_AFTER_SCROLL_FAILURE} retries`,
            e,
          );
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
    }, WAIT_FOR_SCROLL_TO_OFFSET_TIMEOUT);

    // Only when index is greater than 0 and in range of items in FlatList
    // this onScrollToIndexFailed will be called again
  });

  const goToMessage = useCallback(
    (messageId: string) => {
      const indexOfParentInMessageList = messageList.findIndex(
        (message) => message?.id === messageId,
      );
      if (indexOfParentInMessageList !== -1 && flatListRef.current) {
        clearTimeout(failScrollTimeoutId.current);
        scrollToIndexFailedRetryCountRef.current = 0;
        flatListRef.current.scrollToIndex({
          animated: true,
          index: indexOfParentInMessageList,
          viewPosition: 0.5, // try to place message in the center of the screen
        });
        // keep track of this messageId, so that we dont scroll to again in useEffect for targeted message change
        messageIdLastScrolledToRef.current = messageId;
        setTargetedMessage(messageId);
        return;
      }
      messageIdToScrollToRef.current = messageId; // keep track of the id to scroll afterwards
      loadChannelAroundMessage({ messageId }); // now try to load the message and whats around it
      resetPaginationTrackersRef.current();
    },
    [messageList],
  );

  /**
   * Check if a messageId needs to be scrolled to after list loads, and scroll to it
   * Note: This effect fires on every list change with a small debounce so that scrolling isnt abrupted by an immediate rerender
   */
  useEffect(() => {
    scrollToDebounceTimeoutRef.current = setTimeout(() => {
      if (initialScrollToFirstUnreadMessage) {
        initialScrollSettingTimeoutRef.current = setTimeout(() => {
          // small timeout to ensure that handleScroll is called after scrollToIndex to set this flag
          setInitialScrollDone(true);
        }, 500);
      }
      // goToMessage method might have requested to scroll to a message
      let messageIdToScroll: string | undefined = messageIdToScrollToRef.current;
      if (targetedMessage && messageIdLastScrolledToRef.current !== targetedMessage) {
        // if some messageId was targeted but not scrolledTo yet
        // we have scroll to there after loading completes
        messageIdToScroll = targetedMessage;
      }
      if (!messageIdToScroll) return;
      const indexOfParentInMessageList = messageList.findIndex(
        (message) => message?.id === messageIdToScroll,
      );
      if (indexOfParentInMessageList !== -1 && flatListRef.current) {
        // By a fresh scroll we should clear the retries for the previous failed scroll
        clearTimeout(failScrollTimeoutId.current);
        scrollToIndexFailedRetryCountRef.current = 0;
        flatListRef.current.scrollToIndex({
          animated: false,
          index: indexOfParentInMessageList,
          viewPosition: 0.5, // try to place message in the center of the screen
        });
        // reset the messageId tracker to not scroll to that again
        messageIdToScrollToRef.current = undefined;
        // keep track of this messageId, so that we dont scroll to again for targeted message change
        messageIdLastScrolledToRef.current = messageIdToScroll;
      }
    }, 150);
    return () => {
      clearTimeout(failScrollTimeoutId.current);
      clearTimeout(scrollToDebounceTimeoutRef.current);
      clearTimeout(initialScrollSettingTimeoutRef.current);
    };
  }, [targetedMessage, initialScrollToFirstUnreadMessage, messageList]);

  const messagesWithImages =
    legacyImageViewerSwipeBehaviour &&
    messageList.filter((message) => {
      const isMessageTypeDeleted = message.type === 'deleted';
      if (!isMessageTypeDeleted && message.attachments) {
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
      setMessages(messagesWithImages as MessageType<StreamChatGenerics>[]);
    }
  }, [
    imageString,
    isListActive,
    legacyImageViewerSwipeBehaviour,
    numberOfMessagesWithImages,
    threadExists,
    threadList,
  ]);

  const stickyHeaderFormatDate =
    stickyHeaderDate?.getFullYear() === new Date().getFullYear() ? 'MMM D' : 'MMM D, YYYY';
  const tStickyHeaderDate =
    stickyHeaderDate && !hideStickyDateHeader ? tDateTimeParser(stickyHeaderDate) : null;

  const stickyHeaderDateString = useMemo(() => {
    if (tStickyHeaderDate === null || hideStickyDateHeader) return null;
    if (isDayOrMoment(tStickyHeaderDate)) return tStickyHeaderDate.format(stickyHeaderFormatDate);

    return new Date(tStickyHeaderDate).toDateString();
  }, [tStickyHeaderDate, stickyHeaderFormatDate, hideStickyDateHeader]);

  const dismissImagePicker = () => {
    if (!hasMoved && selectedPicker) {
      setSelectedPicker(undefined);
      closePicker();
    }
  };
  const onScrollBeginDrag = () => !hasMoved && selectedPicker && setHasMoved(true);
  const onScrollEndDrag = () => hasMoved && selectedPicker && setHasMoved(false);

  const refCallback = (ref: FlatListType<MessageType<StreamChatGenerics>>) => {
    flatListRef.current = ref;

    if (setFlatListRef) {
      setFlatListRef(ref);
    }
  };

  const debugRef = useDebugContext();

  const isDebugModeEnabled = __DEV__ && debugRef && debugRef.current;

  if (isDebugModeEnabled) {
    if (debugRef.current.setEventType) debugRef.current.setEventType('send');
    if (debugRef.current.setSendEventParams)
      debugRef.current.setSendEventParams({
        action: thread ? 'ThreadList' : 'Messages',
        data: messageList,
      });
  }

  const renderListEmptyComponent = useCallback(
    () => (
      <View
        style={[styles.flex, shouldApplyAndroidWorkaround ? styles.invertAndroid : styles.invert]}
        testID='empty-state'
      >
        <EmptyStateIndicator listType='message' />
      </View>
    ),
    [EmptyStateIndicator, shouldApplyAndroidWorkaround],
  );

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

  if (!FlatList) return null;

  if (loading) {
    return (
      <View style={styles.flex}>
        <LoadingIndicator listType='message' />
      </View>
    );
  }

  const StickyHeaderComponent = () => {
    if (!stickyHeaderDateString) return null;
    if (StickyHeader) return <StickyHeader dateString={stickyHeaderDateString} />;
    if (messageListLengthAfterUpdate) return <DateHeader dateString={stickyHeaderDateString} />;
    return null;
  };

  // We need to omit the style related props from the additionalFlatListProps and add them directly instead of spreading
  let additionalFlatListPropsExcludingStyle:
    | Omit<NonNullable<typeof additionalFlatListProps>, 'style' | 'contentContainerStyle'>
    | undefined;

  if (additionalFlatListProps) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentContainerStyle, style, ...rest } = additionalFlatListProps;
    additionalFlatListPropsExcludingStyle = rest;
  }

  return (
    <View
      style={[styles.container, { backgroundColor: white_snow }, container]}
      testID='message-flat-list-wrapper'
    >
      <FlatList
        CellRendererComponent={
          shouldApplyAndroidWorkaround ? InvertedCellRendererComponent : undefined
        }
        contentContainerStyle={[
          styles.contentContainer,
          additionalFlatListProps?.contentContainerStyle,
          contentContainer,
        ]}
        data={messageList}
        /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
        extraData={disabled || !hasNoMoreRecentMessagesToLoad}
        inverted={shouldApplyAndroidWorkaround ? false : inverted}
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        maintainVisibleContentPosition={{
          autoscrollToTopThreshold: autoscrollToTop ? 10 : undefined,
          minIndexForVisible: 1,
        }}
        maxToRenderPerBatch={30}
        onScroll={handleScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        onScrollToIndexFailed={onScrollToIndexFailedRef.current}
        onTouchEnd={dismissImagePicker}
        onViewableItemsChanged={onViewableItemsChanged.current}
        ref={refCallback}
        renderItem={renderItem}
        scrollEnabled={overlay === 'none'}
        showsVerticalScrollIndicator={!shouldApplyAndroidWorkaround}
        style={[
          styles.listContainer,
          listContainer,
          additionalFlatListProps?.style,
          shouldApplyAndroidWorkaround ? styles.invertAndroid : undefined,
        ]}
        testID='message-flat-list'
        viewabilityConfig={flatListViewabilityConfig}
        {...additionalFlatListPropsExcludingStyle}
      />
      {!loading && (
        <>
          <View style={styles.stickyHeader}>
            <StickyHeaderComponent />
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
        </>
      )}
      <NetworkDownIndicator />
    </View>
  );
};

export type MessageListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<MessageListPropsWithContext<StreamChatGenerics>>;

export const MessageList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: MessageListProps<StreamChatGenerics>,
) => {
  const { closePicker, selectedPicker, setSelectedPicker } = useAttachmentPickerContext();
  const {
    channel,
    disabled,
    EmptyStateIndicator,
    enableMessageGroupingByUser,
    error,
    hideStickyDateHeader,
    isChannelActive,
    loadChannelAroundMessage,
    loading,
    LoadingIndicator,
    markRead,
    NetworkDownIndicator,
    reloadChannel,
    scrollToFirstUnreadThreshold,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
  } = useChannelContext<StreamChatGenerics>();
  const { client } = useChatContext<StreamChatGenerics>();
  const { setMessages } = useImageGalleryContext<StreamChatGenerics>();
  const {
    DateHeader,
    disableTypingIndicator,
    FlatList,
    initialScrollToFirstUnreadMessage,
    InlineDateSeparator,
    InlineUnreadIndicator,
    legacyImageViewerSwipeBehaviour,
    Message,
    MessageSystem,
    myMessageTheme,
    ScrollToBottomButton,
    TypingIndicator,
    TypingIndicatorContainer,
  } = useMessagesContext<StreamChatGenerics>();
  const { hasNoMoreRecentMessagesToLoad, loadMore, loadMoreRecent } =
    usePaginatedMessageListContext<StreamChatGenerics>();
  const { overlay } = useOverlayContext();
  const { loadMoreThread, thread } = useThreadContext<StreamChatGenerics>();
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
        enableMessageGroupingByUser,
        error,
        FlatList,
        hasNoMoreRecentMessagesToLoad,
        hideStickyDateHeader,
        initialScrollToFirstUnreadMessage,
        InlineDateSeparator,
        InlineUnreadIndicator,
        isListActive: isChannelActive,
        legacyImageViewerSwipeBehaviour,
        loadChannelAroundMessage,
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
        setMessages,
        setSelectedPicker,
        setTargetedMessage,
        StickyHeader,
        t,
        targetedMessage,
        tDateTimeParser,
        thread,
        TypingIndicator,
        TypingIndicatorContainer,
      }}
      {...props}
      noGroupByUser={!enableMessageGroupingByUser || props.noGroupByUser}
    />
  );
};
