import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollViewProps, StyleSheet, View, useColorScheme } from 'react-native';

import Animated from 'react-native-reanimated';

import type { FlashListProps, FlashListRef } from '@shopify/flash-list';
import type { LocalMessage } from 'stream-chat';

import { getAttachmentPreviewUrl } from 'stream-chat';

import { useMarkRead } from './hooks/useMarkRead';
import { useMessageList } from './hooks/useMessageList';
import { useMessageListFocus } from './hooks/useMessageListFocus';
import { useMessageListLiveState } from './hooks/useMessageListLiveState';
import { useMessageListPagination } from './hooks/useMessageListPagination';
import { useOwnUnreadCount } from './hooks/useOwnUnreadCount';
import { useScrollToBottomAccessibilityAction } from './hooks/useScrollToBottomAccessibilityAction';
import { useShouldScrollToRecentOnNewOwnMessage } from './hooks/useShouldScrollToRecentOnNewOwnMessage';
import { useStickyHeaderDate } from './hooks/useStickyHeaderDate';
import { useTypingUsers } from './hooks/useTypingUsers';
import { useUnreadNotificationVisibility } from './hooks/useUnreadNotificationVisibility';
import { InlineLoadingMoreIndicator } from './InlineLoadingMoreIndicator';
import { InlineLoadingMoreRecentIndicator } from './InlineLoadingMoreRecentIndicator';
import { getMessageListItemCacheKey } from './utils/buildMessageListWithNeighbours';

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

import { useStableCallback, useStateStore } from '../../hooks';
import { isVideoPlayerAvailable } from '../../native';
import { bumpOverlayLayoutRevision, useHasActiveId } from '../../state-store';
import { MessageInputHeightState } from '../../state-store/message-input-height-store';
import { primitives } from '../../theme';
import type { ScrollViewRef, ViewabilityConfig, ViewToken } from '../../types/react-native-compat';
import { FileTypes } from '../../types/types';
import { transitions } from '../../utils/animations/transitions';
import { MarkReadFunctionOptions } from '../Channel/Channel';
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

// Delegates to the neighbour-cache key so the render key and the cache key cannot drift apart.
const keyExtractor = (item: LocalMessage, index: number) => getMessageListItemCacheKey(item, index);

const flatListViewabilityConfig: ViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 1,
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
    'channel' | 'disabled' | 'hideStickyDateHeader' | 'hasPendingInitialTargetLoad' | 'threadList'
  > &
  Pick<ChatContextValue, 'client'> &
  Pick<MessageInputContextValue, 'messageInputFloating' | 'messageInputHeightStore'> & {
    /**
     * Whether the composer lets a message be sent while its attachments are still uploading
     * (`messageComposer.attachments.pendingUploadsEnabled`). Read from the composer by default.
     */
    pendingUploadsEnabled: boolean;
    markRead: (options?: MarkReadFunctionOptions) => void;
  } & Pick<MessagesContextValue, 'disableTypingIndicator' | 'myMessageTheme'> &
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
      !!getAttachmentPreviewUrl(attachment, attachment.image_url, attachment.thumb_url);
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

const MessageFlashListWithContext = (props: MessageFlashListPropsWithContext) => {
  const {
    attachmentPickerStore,
    additionalFlashListProps,
    channel,
    client,
    closePicker,
    disabled,
    disableTypingIndicator,
    FooterComponent,
    HeaderComponent = InlineLoadingMoreIndicator,
    hideStickyDateHeader,
    isLiveStreaming = false,
    markRead,
    messageInputFloating,
    messageInputHeightStore,
    myMessageTheme,
    pendingUploadsEnabled,
    readEvents,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
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
  const paginator = threadList ? threadInstance?.messagePaginator : channel.messagePaginator;

  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

  /**
   * The timeout id used to debounce our scrollToIndex calls on messageList updates
   */
  const scrollToDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    paginator,
  });
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

  const latestNonCurrentMessageBeforeUpdateRef = useRef<LocalMessage>(undefined);

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

  const lastFocusScrollTokenRef = useRef<number | undefined>(undefined);

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
      paginator?.scheduleMessageFocusSignalClear({ token: focusToken });
    }, WAIT_FOR_SCROLL_TIMEOUT);
  }, [paginator, focusToken, focusedMessageId, processedMessageList]);

  useEffect(() => {
    if (!processedMessageList.length || !paginator) {
      return;
    }

    if (paginator.hasMoreHead) {
      latestNonCurrentMessageBeforeUpdateRef.current = paginator.lastMessage ?? undefined;
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
  }, [paginator, processedMessageList, shouldScrollToRecentOnNewOwnMessageRef]);

  /**
   * FlatList doesn't accept changeable function for onViewableItemsChanged prop.
   * Thus useRef.
   */
  const unstableOnViewableItemsChanged = ({
    viewableItems,
  }: {
    viewableItems: ViewToken<LocalMessage>[] | undefined;
  }) => {
    if (!viewableItems) {
      return;
    }
    viewabilityChangedCallback({ inverted: false, viewableItems });

    const viewableMessages = viewableItems.map((viewable) => viewable.item);
    // Not inverted: the first viewable item is the topmost one on screen.
    const topVisibleMessage = viewableMessages[0];
    const isAtOldestMessage =
      topVisibleMessage !== undefined &&
      !paginator?.hasMoreTail &&
      processedMessageList[0]?.id === topVisibleMessage.id;

    if (!hideStickyDateHeader && topVisibleMessage) {
      updateStickyHeaderDate({ isAtOldestMessage, topVisibleMessage });
    }
    if (!threadList) {
      updateUnreadNotification({ isAtOldestMessage, topVisibleMessage, viewableMessages });
    }
    // Viewability reflects the real layout, so this is right even at mount: a channel opened at its
    // first unread has the newest message off screen and is not viewing live.
    reportViewableMessages(viewableMessages);
  };

  const onViewableItemsChanged = useRef(unstableOnViewableItemsChanged);
  onViewableItemsChanged.current = unstableOnViewableItemsChanged;

  const stableOnViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<LocalMessage>[] | undefined }) => {
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
   * Pagination is driven from the scroll position rather than the list's `onEndReached`, from a
   * fixed distance to either edge. Not inverted: the top is the oldest end.
   */
  const onUserScrollEvent: NonNullable<ScrollViewProps['onScroll']> = useStableCallback((event) => {
    const nativeEvent = event.nativeEvent;
    const offset = nativeEvent.contentOffset.y;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;

    const isScrollAtTop = offset < 100;
    const isScrollAtBottom = contentLength - visibleLength - offset < 100;

    if (isScrollAtTop) {
      loadMore();
    }

    if (isScrollAtBottom) {
      loadMoreRecent();
    }
  });

  const handleScroll: ScrollViewProps['onScroll'] = useStableCallback((event) => {
    const messageListHasMessages = processedMessageList.length > 0;
    const nativeEvent = event.nativeEvent;
    const offset = nativeEvent.contentOffset.y;
    const visibleLength = nativeEvent.layoutMeasurement.height;
    const contentLength = nativeEvent.contentSize.height;

    const isScrollAtBottom = contentLength - visibleLength - offset < messageInputHeight;

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

  const scrollToBottomUnreadCount = useOwnUnreadCount(
    scrollToBottomButtonVisible && !threadList ? channel : undefined,
  );
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

  const refCallback = useStableCallback((ref: FlashListRef<LocalMessage>) => {
    flashListRef.current = ref;

    if (setFlatListRef) {
      setFlatListRef(ref);
    }
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
    // `getNativeScrollRef()` is typed as returning the `ScrollView` *component* by flash-list,
    // which under React Native 0.87's Strict TypeScript API is a function type rather than the
    // host instance it actually returns at runtime. Re-assert the instance type.
    const nativeScrollRef = flashListRef.current?.getNativeScrollRef() as
      | ScrollViewRef
      | null
      | undefined;
    nativeScrollRef?.setNativeProps({
      contentOffset: {
        x: 0,
        y: (flashListRef.current?.getAbsoluteLastScrollOffset() ?? 0) + changedBy,
      },
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
        <InlineLoadingMoreRecentIndicator loadingMoreRecent={loadingMoreRecent} />
        {!disableTypingIndicator && TypingIndicator && (
          <TypingIndicatorContainer>
            <TypingIndicator />
          </TypingIndicatorContainer>
        )}
      </FlashListFooterTypingAdapter>
    );
  }, [
    FooterComponent,
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
      {processedMessageList.length === 0 && !threadList ? (
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
            onScrollBeginDrag={onUserScrollEvent}
            onScrollEndDrag={onUserScrollEvent}
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
        {processedMessageList.length > 0 && StickyHeader ? (
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
        filter={pendingUploadsEnabled ? excludeCanceledUploadNotifications : undefined}
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
    hasPendingInitialTargetLoad,
    threadList,
  } = useChannelContext();
  const markRead = useMarkRead(channel);
  const { client } = useChatContext();
  const { disableTypingIndicator, myMessageTheme } = useMessagesContext();
  const { threadInstance } = useThreadContext();
  const { readEvents } = useOwnCapabilitiesContext();
  const pendingUploadsEnabled = usePendingUploadsEnabled();
  const { messageInputFloating, messageInputHeightStore } = useMessageInputContext();

  return (
    <MessageFlashListWithContext
      {...{
        attachmentPickerStore,
        channel,
        client,
        closePicker,
        disabled,
        disableTypingIndicator,
        hideStickyDateHeader,
        markRead,
        messageInputFloating,
        messageInputHeightStore,
        myMessageTheme,
        pendingUploadsEnabled,
        readEvents,
        hasPendingInitialTargetLoad,
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
