import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatListProps,
  FlatList as FlatListType,
  Platform,
  ScrollViewProps,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';

import { MessageType, useMessageList } from './hooks/useMessageList';
import { getLastReceivedMessage } from './utils/getLastReceivedMessage';

import {
  AttachmentPickerContextValue,
  useAttachmentPickerContext,
} from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
import {
  ChannelContextValue,
  useChannelContext,
} from '../../contexts/channelContext/ChannelContext';
import {
  ChatContextValue,
  useChatContext,
} from '../../contexts/chatContext/ChatContext';
import {
  ImageGalleryContextValue,
  useImageGalleryContext,
} from '../../contexts/imageGalleryContext/ImageGalleryContext';
import {
  GroupType,
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../contexts/threadContext/ThreadContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  TranslationContextValue,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

import type { Attachment, Channel as StreamChannel } from 'stream-chat';

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
  activityIndicatorContainer: {
    padding: 10,
    width: '100%',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
  },
  errorNotification: {
    alignItems: 'center',
    left: 0,
    paddingVertical: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  errorNotificationText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  flex: { flex: 1 },
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

const limitForUnreadScrolledUp = 4;

const keyExtractor = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  item: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
) =>
  item.id ||
  (item.created_at
    ? typeof item.created_at === 'string'
      ? item.created_at
      : item.created_at.toISOString()
    : Date.now().toString());

type MessageListPropsWithContext<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Pick<
  AttachmentPickerContextValue,
  'closePicker' | 'selectedPicker' | 'setSelectedPicker'
> &
  Pick<
    ChannelContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'channel'
    | 'disabled'
    | 'EmptyStateIndicator'
    | 'loadChannelAtMessage'
    | 'loading'
    | 'LoadingIndicator'
    | 'markRead'
    | 'reloadChannel'
    | 'setTargetedMessage'
    | 'StickyHeader'
    | 'targetedMessage'
    | 'typingEventsEnabled'
  > &
  Pick<ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'client' | 'isOnline'> &
  Pick<ImageGalleryContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'setImages'> &
  Pick<
    MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'DateHeader'
    | 'disableTypingIndicator'
    | 'FlatList'
    | 'InlineUnreadIndicator'
    | 'loadingMoreRecent'
    | 'loadMore'
    | 'loadMoreRecent'
    | 'Message'
    | 'MessageNotification'
    | 'MessageSystem'
    | 'TypingIndicator'
    | 'TypingIndicatorContainer'
  > &
  Pick<
    ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'loadMoreThread' | 'thread'
  > &
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
    additionalFlatListProps?: Partial<
      FlatListProps<MessageType<At, Ch, Co, Ev, Me, Re, Us>>
    >;
    /**
     * UI component for footer of message list. By default message list doesn't have any footer.
     * This is a [ListHeaderComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header by default if inverted is true or defaulted
     *
     */
    FooterComponent?: React.ReactElement;
    /**
     * UI component for header of message list. By default message list doesn't have any header.
     * This is a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
     * used in MessageList. Should be used for header if inverted is false
     *
     */
    HeaderComponent?: React.ReactElement;
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
    onThreadSelect?: (
      message: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>['thread'],
    ) => void;
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
    setFlatListRef?: (
      ref: FlatListType<MessageType<At, Ch, Co, Ev, Me, Re, Us>> | null,
    ) => void;
    /**
     * Boolean whether or not the Messages in the MessageList are part of a Thread
     **/
    threadList?: boolean;
  };

/**
 * The message list component renders a list of messages. It consumes the following contexts:
 *
 * [ChannelContext](https://getstream.github.io/stream-chat-react-native/#channelcontext)
 * [ChatContext](https://getstream.github.io/stream-chat-react-native/#chatcontext)
 * [MessagesContext](https://getstream.github.io/stream-chat-react-native/#messagescontext)
 * [ThreadContext](https://getstream.github.io/stream-chat-react-native/#threadcontext)
 * [TranslationContext](https://getstream.github.io/stream-chat-react-native/#translationcontext)
 *
 * @example ./MessageList.md
 */
const MessageListWithContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
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
    FooterComponent,
    HeaderComponent,
    InlineUnreadIndicator,
    inverted = true,
    isOnline,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    loadingMoreRecent,
    loadMore,
    loadMoreRecent,
    loadMoreThread,
    markRead,
    Message,
    MessageNotification,
    MessageSystem,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    reloadChannel,
    selectedPicker,
    setFlatListRef,
    setImages,
    setSelectedPicker,
    setTargetedMessage,
    StickyHeader,
    t,
    targetedMessage,
    tDateTimeParser,
    thread,
    threadList = false,
    typingEventsEnabled,
    TypingIndicator,
    TypingIndicatorContainer,
  } = props;

  const {
    theme: {
      colors: { accent_blue, grey, white_snow },
      messageList: {
        container,
        errorNotification,
        errorNotificationText,
        listContainer,
      },
    },
  } = useTheme();

  const messageList = useMessageList<At, Ch, Co, Ev, Me, Re, Us>({
    inverted,
    noGroupByUser,
    threadList,
  });

  const [autoscrollToTopThreshold, setAutoscrollToTopThreshold] = useState(
    !channel?.state.isUpToDate ? -1000 : 10,
  );

  const flatListRef = useRef<FlatListType<
    MessageType<At, Ch, Co, Ev, Me, Re, Us>
  > | null>(null);
  const yOffset = useRef(0);

  const [hasMoved, setHasMoved] = useState(false);
  const [lastReceivedId, setLastReceivedId] = useState(
    getLastReceivedMessage(messageList)?.id,
  );
  const lastMessageListLength = useRef(channel?.state.messages.length);
  const [newMessagesNotification, setNewMessageNotification] = useState(false);
  const messageScrollPosition = useRef(0);

  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date>(new Date());
  const stickyHeaderDateRef = useRef(new Date());

  const viewableMessages = useRef<string[]>([]);
  const updateStickyDate = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableMessages.current = viewableItems.map((v) => v.item.id);
      if (viewableItems?.length) {
        const lastItem = viewableItems.pop();

        if (
          lastItem?.item?.created_at?.asMutable &&
          !lastItem.item.deleted_at &&
          lastItem.item.created_at.asMutable().toDateString() !==
            stickyHeaderDateRef.current.toDateString()
        ) {
          stickyHeaderDateRef.current = lastItem.item.created_at.asMutable();
          setStickyHeaderDate(lastItem.item.created_at.asMutable() as Date);
        }
      }
    },
  );

  useEffect(() => {
    setNewMessageNotification(false);
  }, [disabled]);

  const channelExits = !!channel;

  useEffect(() => {
    if (channel && channel.countUnread() <= limitForUnreadScrolledUp) {
      channel.markRead();
    }
  }, [channelExits]);

  const messageListValues = messageList.reduce(
    (acc, cur, index) =>
      `${index === 0 || index === messageList.length - 1 ? cur.id : ''}${acc}`,
    '',
  );
  useEffect(() => {
    const currentLastMessage = getLastReceivedMessage(messageList);
    if (currentLastMessage && channel) {
      const currentLastReceivedId = currentLastMessage.id;
      const currentMessageListLength = channel?.state.messages.length;
      if (currentLastReceivedId) {
        const hasNewMessage =
          lastMessageListLength.current &&
          lastReceivedId !== currentLastReceivedId &&
          currentMessageListLength - lastMessageListLength.current === 1;
        const userScrolledUp = yOffset.current > 0;
        const isOwner =
          currentLastMessage &&
          client &&
          currentLastMessage.user?.id === client.userID;

        if (hasNewMessage && (!isOwner || userScrolledUp)) {
          setNewMessageNotification(true);
        }

        if (!channel?.state.isUpToDate) {
          setNewMessageNotification(true);
        }

        // always scroll down when it's your own message that you added..
        const scrollToBottom =
          channel?.state.isUpToDate &&
          hasNewMessage &&
          (isOwner || !userScrolledUp);

        if (scrollToBottom && flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: 0 });
          setNewMessageNotification(false);
          if (!isOwner) {
            markRead();
          }
        }

        setLastReceivedId(currentLastReceivedId);
        lastMessageListLength.current = channel?.state.messages.length;
      }
    }
  }, [messageListValues]);

  useEffect(() => {
    // Lets wait so that list gets rendered, before we update autoscrollToTopThreshold,
    setAutoscrollToTopThreshold(!channel?.state.isUpToDate ? -1000 : 10);
  }, [messageListValues]);

  const isUnreadMessage = (
    message: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
    lastRead: ReturnType<StreamChannel<At, Ch, Co, Ev, Me, Re, Us>['lastRead']>,
  ) =>
    message && lastRead && message.created_at && lastRead < message.created_at;

  const renderItem = (
    message: MessageType<At, Ch, Co, Ev, Me, Re, Us>,
    index: number,
  ) => {
    if (!channel) return null;

    const lastRead = channel?.lastRead();

    const lastMessage = messageList?.[index + 1];

    const showUnreadUnderlay =
      !!isUnreadMessage(message, lastRead) && newMessagesNotification;
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

    if (message.type !== 'message.read') {
      return (
        <>
          <Message
            goToMessage={goToMessage}
            groupStyles={message.groupStyles as GroupType[]}
            lastReceivedId={
              lastReceivedId === message.id ? lastReceivedId : undefined
            }
            message={message}
            onThreadSelect={onThreadSelect}
            showUnreadUnderlay={showUnreadUnderlay}
            style={styles.messagePadding}
            targetedMessage={targetedMessage === message.id}
            threadList={threadList}
          />
          {/* Adding indicator below the messages, since the list is inverted */}
          {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
        </>
      );
    }

    return null;
  };

  const loadMoreRecentMessages = () => {
    if (!channel?.state.isUpToDate) {
      loadMoreRecent();
    }
  };

  const handleScroll: ScrollViewProps['onScroll'] = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const removeNewMessageNotification = y <= 10 && channel?.state.isUpToDate;
    if (
      !threadList &&
      removeNewMessageNotification &&
      channel &&
      channel.countUnread() > 0
    ) {
      markRead();
    }

    if (y <= 30) {
      messageScrollPosition.current = messageList.length;
      loadMoreRecentMessages();
    }

    yOffset.current = y;
    if (removeNewMessageNotification) {
      setNewMessageNotification(false);
    }
    if (onListScroll) {
      onListScroll(event);
    }
  };

  const goToNewMessages = async () => {
    if (!channel?.state.isUpToDate) {
      await reloadChannel();
    }
    setNewMessageNotification(false);
    if (!threadList) {
      markRead();
    }
  };

  const goToMessage = (messageId: string) => {
    const indexOfParentInViewable = viewableMessages.current.indexOf(messageId);

    if (indexOfParentInViewable > -1) {
      const indexOfParentInMessageList = messageList.findIndex(
        (message) => message?.id === messageId,
      );

      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: indexOfParentInMessageList - 1,
        });
      }

      setTargetedMessage(messageId);
    } else {
      loadChannelAtMessage({ messageId });
    }
  };

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
      (message.attachments as Attachment<At>[])
        .map((attachment) => attachment.image_url || attachment.thumb_url || '')
        .join(),
    )
    .join();

  const numberOfMessagesWithImages = messagesWithImages.length;
  const threadExists = !!thread;
  useEffect(() => {
    if ((threadList && thread) || (!threadList && !thread)) {
      setImages(messagesWithImages);
    }
  }, [imageString, numberOfMessagesWithImages, threadExists, threadList]);

  const stickyHeaderFormatDate =
    stickyHeaderDate.getFullYear() === new Date().getFullYear()
      ? 'MMM D'
      : 'MMM D, YYYY';
  const tStickyHeaderDate = tDateTimeParser(stickyHeaderDate);
  const stickyHeaderDateToRender = isDayOrMoment(tStickyHeaderDate)
    ? tStickyHeaderDate.format(stickyHeaderFormatDate)
    : new Date(tStickyHeaderDate).toDateString();

  if (!FlatList) return null;

  const dismissImagePicker = () => {
    if (!hasMoved && selectedPicker) {
      setSelectedPicker(undefined);
      closePicker();
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: white_snow }, container]}
    >
      <FlatList
        contentContainerStyle={styles.contentContainer}
        data={messageList}
        /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
        extraData={disabled || !channel?.state.isUpToDate}
        inverted={inverted}
        keyboardShouldPersistTaps='handled'
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <View style={styles.flex}>
            {loading ? (
              <LoadingIndicator listType='message' />
            ) : (
              <View style={styles.flex} testID='empty-state'>
                <EmptyStateIndicator listType='message' />
              </View>
            )}
          </View>
        }
        ListFooterComponent={FooterComponent}
        // TODO: Scrolling doesn't work perfectly with this loading indicator. Investigate and fix.
        ListHeaderComponent={() =>
          HeaderComponent ? (
            HeaderComponent
          ) : Platform.OS !== 'android' && loadingMoreRecent ? (
            <View style={[styles.activityIndicatorContainer]}>
              <ActivityIndicator color={accent_blue} size='small' />
            </View>
          ) : null
        }
        maintainVisibleContentPosition={{
          autoscrollToTopThreshold,
          minIndexForVisible: 1,
        }}
        onEndReached={threadList ? loadMoreThread : loadMore}
        onScroll={handleScroll}
        onScrollBeginDrag={() => setHasMoved(true)}
        onScrollEndDrag={() => setHasMoved(false)}
        onTouchEnd={dismissImagePicker}
        onViewableItemsChanged={updateStickyDate.current}
        ref={(ref) => {
          flatListRef.current = ref;

          if (setFlatListRef) {
            setFlatListRef(ref);
          }
        }}
        renderItem={({ index, item }) => renderItem(item, index)}
        style={[styles.listContainer, listContainer]}
        testID='message-flat-list'
        viewabilityConfig={{
          viewAreaCoveragePercentThreshold: 50,
        }}
        {...additionalFlatListProps}
      />
      {!loading && (
        <>
          <View style={styles.stickyHeader}>
            {StickyHeader ? (
              <StickyHeader dateString={stickyHeaderDateToRender} />
            ) : (
              <DateHeader dateString={stickyHeaderDateToRender} />
            )}
          </View>
          {!disableTypingIndicator &&
            TypingIndicator &&
            typingEventsEnabled !== false && (
              <TypingIndicatorContainer>
                <TypingIndicator />
              </TypingIndicatorContainer>
            )}
          <MessageNotification
            onPress={goToNewMessages}
            showNotification={newMessagesNotification}
            unreadCount={channel?.countUnread()}
          />
        </>
      )}
      {!isOnline && (
        <View
          style={[
            styles.errorNotification,
            { backgroundColor: `${grey}E6` },
            errorNotification,
          ]}
          testID='error-notification'
        >
          <Text style={[styles.errorNotificationText, errorNotificationText]}>
            {t('Reconnecting...')}
          </Text>
        </View>
      )}
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
  Us extends UnknownType = DefaultUserType
> = Partial<MessageListPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>>;

export const MessageList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: MessageListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    closePicker,
    selectedPicker,
    setSelectedPicker,
  } = useAttachmentPickerContext();
  const {
    channel,
    disabled,
    EmptyStateIndicator,
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    markRead,
    reloadChannel,
    setTargetedMessage,
    StickyHeader,
    targetedMessage,
    typingEventsEnabled,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setImages } = useImageGalleryContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    DateHeader,
    disableTypingIndicator,
    FlatList,
    InlineUnreadIndicator,
    loadingMoreRecent,
    loadMore,
    loadMoreRecent,
    Message,
    MessageNotification,
    MessageSystem,
    TypingIndicator,
    TypingIndicatorContainer,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { loadMoreThread, thread } = useThreadContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
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
        FlatList,
        InlineUnreadIndicator,
        isOnline,
        loadChannelAtMessage,
        loading,
        LoadingIndicator,
        loadingMoreRecent,
        loadMore,
        loadMoreRecent,
        loadMoreThread,
        markRead,
        Message,
        MessageNotification,
        MessageSystem,
        reloadChannel,
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
