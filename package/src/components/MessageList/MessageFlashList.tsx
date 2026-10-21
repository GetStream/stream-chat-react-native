import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollViewProps, StyleSheet, View, useColorScheme } from 'react-native';

import Animated from 'react-native-reanimated';

import type { FlashListProps, FlashListRef } from '@shopify/flash-list';
import type { LocalMessage, Thread } from 'stream-chat';

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
import { ThreadFooterComponent } from '../Thread/components/ThreadFooterComponent';
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
    'channel' | 'disabled' | 'hideStickyDateHeader' | 'hasPendingInitialTargetLoad'
  > &
  Pick<ChatContextValue, 'client'> &
  Pick<MessageInputContextValue, 'messageInputFloating' | 'messageInputHeightStore'> & {
    /**
     * Whether a message can be sent while its attachments are still uploading. Read from
     * `messageComposer.attachments.pendingUploadsEnabled` by default.
     */
    pendingUploadsEnabled: boolean;
    markRead: (options?: MarkReadFunctionOptions) => void;
  } & Pick<MessagesContextValue, 'disableTypingIndicator' | 'myMessageTheme'> &
  Pick<ThreadContextValue, 'thread'> & {
    /**
     * Extra props for the underlying FlashList, applied over the defaults. To get the list ref, use
     * `setFlatListRef`.
     */
    additionalFlashListProps?: Partial<FlashListProps<LocalMessage>>;
    /**
     * Rendered as the list footer, which is the newest-message end. Defaults to the
     * loading-more-recent indicator followed by the typing indicator.
     */
    FooterComponent?: React.ComponentType;
    /**
     * Rendered as the list header, which is the older-message end. Receives `loadingMore`. Defaults
     * to `ThreadFooterComponent` in a thread, `InlineLoadingMoreIndicator` otherwise.
     */
    HeaderComponent?: React.ComponentType<{ loadingMore?: boolean }>;
    /** Turns off grouping of messages by user. */
    noGroupByUser?: boolean;
    onListScroll?: ScrollViewProps['onScroll'];
    /**
     * Called when the replies button of a message is pressed.
     *
     * @param thread The thread of the message, to render in a `<Thread thread={thread}>`.
     */
    onThreadSelect?: (thread: Thread) => void;
    /** Receives the ref of the inner FlashList. */
    setFlatListRef?: (ref: FlashListRef<LocalMessage> | null) => void;
    /**
     * Tunes autoscroll for live-streaming scenarios, where many messages arrive in a short time.
     * Defaults to false.
     *
     * @experimental
     */
    isLiveStreaming?: boolean;
  };

const WAIT_FOR_SCROLL_TIMEOUT = 0;

// Classifies a message with attachments by its primary shape, so FlashList recycles only
// same-shaped cells. The gallery is the heaviest subtree to mount, so one gallery image or video
// returns at once: gallery cells then recycle only with each other and reconcile on rebind instead
// of remounting. Mirrors the attachment categorization in Message.
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
    HeaderComponent: HeaderComponentProp,
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
    thread,
  } = props;

  // Inside a thread the parent message and the older-replies indicator sit above the replies.
  const HeaderComponent =
    HeaderComponentProp ?? (thread ? ThreadFooterComponent : InlineLoadingMoreIndicator);
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
  const paginator = thread ? thread.messagePaginator : channel.messagePaginator;

  const [scrollToBottomButtonVisible, setScrollToBottomButtonVisible] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);

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
    thread,
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

  // Autoscroll-to-recent is suppressed while the message overlay is open, so incoming messages do
  // not shift content under the overlay's anchored geometry. `startRenderingFromBottom` stays on.
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

  // Scrolls to the focused message (`messageFocusSignal`) once it is rendered. Each focus token is
  // handled once, so list changes during the highlight do not re-scroll.
  useEffect(() => {
    if (!focusedMessageId || focusToken === lastFocusScrollTokenRef.current) {
      return;
    }

    const indexOfParentInMessageList = processedMessageList.findIndex(
      (message) => message?.id === focusedMessageId,
    );

    // Not in the rendered window yet: a later `processedMessageList` change re-runs this effect.
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
      // The client does not start the highlight's auto-dismiss countdown on emit, as the message
      // may not be visible yet. Start it now that the message is scrolled into view.
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
      // A new own message scrolls to the latest wherever the list currently is.
      if (shouldScrollToRecentOnNewOwnMessage) {
        flashListRef.current?.scrollToEnd({
          animated: true,
        });
      }
    }
  }, [paginator, processedMessageList, shouldScrollToRecentOnNewOwnMessageRef]);

  // The list does not accept a changing `onViewableItemsChanged`, hence the ref below.
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
    // Content shorter than the window cannot scroll, so FlashList keeps the offset of its initial
    // scroll and misses the oldest message on screen. Short content shows every message.
    const list = flashListRef.current;
    const contentFitsWindow = list
      ? list.getChildContainerDimensions().height <= list.getWindowSize().height
      : false;
    const isAtOldestMessage =
      topVisibleMessage !== undefined &&
      !paginator?.hasMoreTail &&
      (contentFitsWindow || processedMessageList[0]?.id === topVisibleMessage.id);

    if (!hideStickyDateHeader && topVisibleMessage) {
      updateStickyHeaderDate({ isAtOldestMessage, topVisibleMessage });
    }
    if (!thread) {
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
    // FlashList does not expose `setNativeProps`, so scrollability is state.
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

  // Paginates within 100 points of either edge. Not inverted: the top is the oldest end.
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

    // The scroll-to-bottom button shows unless the list is at the bottom with no newer messages.
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
    // A thread marks itself read while it is open, and the channel underneath keeps its own unread
    // state, so only a channel list marks read here.
    if (thread) {
      return;
    }
    // `updateChannelUnreadState: false` keeps the unread label on the first unread message.
    await markRead({
      updateChannelUnreadState: false,
    });
  });

  const scrollToBottomUnreadCount = useOwnUnreadCount(
    scrollToBottomButtonVisible && !thread ? channel : undefined,
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

  // `style` and `contentContainerStyle` are merged with the SDK styles below, not spread.
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
    // flash-list types `getNativeScrollRef()` as the `ScrollView` component, a function type under
    // React Native 0.87's Strict TypeScript API, but it returns the host instance at runtime.
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
      {processedMessageList.length === 0 && !thread ? (
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
      {isUnreadNotificationOpen && !thread ? (
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
 * Scrolls to the end when the typing indicator appears and the list is near the end, as FlashList
 * does not autoscroll when its footer changes.
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
 * A `MessageList` built on `@shopify/flash-list` for performance. The implementation is subject to
 * change.
 *
 * @experimental
 */
export const MessageFlashList = (props: MessageFlashListProps) => {
  const { closePicker, attachmentPickerStore } = useAttachmentPickerContext();
  const {
    channel,
    disabled,
    enableMessageGroupingByUser,
    hideStickyDateHeader,
    hasPendingInitialTargetLoad,
  } = useChannelContext();
  const markRead = useMarkRead(channel);
  const { client } = useChatContext();
  const { disableTypingIndicator, myMessageTheme } = useMessagesContext();
  const { thread } = useThreadContext();
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
        thread,
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
          // 4 aligns the first inline date (top margin 4) with the date header (top margin 8).
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
