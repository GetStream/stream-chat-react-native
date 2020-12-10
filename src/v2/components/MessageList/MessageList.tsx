import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList as DefaultFlatList,
  FlatListProps,
  Platform,
  ScrollViewProps,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';

import {
  MessageNotification as DefaultMessageNotification,
  MessageNotificationProps,
} from './MessageNotification';
import {
  MessageSystem as DefaultMessageSystem,
  MessageSystemProps,
} from './MessageSystem';
import { TypingIndicator as DefaultTypingIndicator } from './TypingIndicator';
import { TypingIndicatorContainer } from './TypingIndicatorContainer';
import { InlineUnreadIndicator as DefaultInlineUnreadIndicator } from './InlineUnreadIndicator';
import { Message, useMessageList } from './hooks/useMessageList';
import { getLastReceivedMessage } from './utils/getLastReceivedMessage';

import { Message as DefaultMessage } from '../Message/Message';

import {
  GroupType,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import {
  ThreadContextValue,
  useThreadContext,
} from '../../contexts/threadContext/ThreadContext';
import { useChannelContext } from '../../contexts/channelContext/ChannelContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useImageGalleryContext } from '../../contexts/imageGalleryContext/ImageGalleryContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import {
  isDayOrMoment,
  useTranslationContext,
} from '../../contexts/translationContext/TranslationContext';

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
import { DateHeader } from './DateHeader';

import { FlatList } from '../../native';
import {
  isInlineDateSeparator,
  isInlineUnreadIndicator,
  MessageOrInlineSeparator,
} from './utils/insertDates';
import { generateRandomId } from '../../utils/generateRandomId';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    flex: 1,
    width: '100%',
  },
  editStateMask: {
    backgroundColor: 'black',
    height: '100%',
    opacity: 0.4,
    position: 'absolute',
    width: '100%',
    zIndex: 100,
  },
  errorNotification: {
    alignItems: 'center',
    backgroundColor: '#FAE6E8',
    color: '#FF0000',
    padding: 5,
    zIndex: 10,
  },
  errorNotificationText: {
    backgroundColor: '#FAE6E8',
    color: '#FF0000',
  },
  flex: { flex: 1 },
  listContainer: {
    flex: 1,
    paddingHorizontal: 0,
    width: '100%',
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
  item: Message<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  if (isInlineUnreadIndicator(item)) {
    return 'unreadIndicator';
  }

  if (!isInlineDateSeparator(item)) {
    return (
      item.id ||
      (item.created_at
        ? typeof item.created_at === 'string'
          ? item.created_at
          : item.created_at.toISOString()
        : generateRandomId())
    );
  }

  if (item.date && typeof item.date !== 'string') {
    return item.date.toISOString();
  }

  return generateRandomId();
};

export type MessageListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
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
    FlatListProps<Message<At, Ch, Co, Ev, Me, Re, Us>>
  >;
  disableWhileEditing?: boolean;
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
  InlineDateSeparator?: React.ReactElement;
  InlineUnreadIndicator?: React.ReactElement;
  /** Whether or not the FlatList is inverted. Defaults to true */
  inverted?: boolean;
  /**
   * Custom UI component to display a notification message
   * Default component (accepts the same props): [MessageNotification](https://getstream.github.io/stream-chat-react-native/#messagenotification)
   */
  MessageNotification?: React.ComponentType<MessageNotificationProps>;
  /**
   * Custom UI component to display a system message
   * Default component (accepts the same props): [MessageSystem](https://getstream.github.io/stream-chat-react-native/#messagesystem)
   */
  MessageSystem?: React.ComponentType<
    MessageSystemProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
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
    ref: React.MutableRefObject<DefaultFlatList<
      MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>
    > | null>,
  ) => void;
  /**
   * Boolean whether or not the Messages in the MessageList are part of a Thread
   **/
  threadList?: boolean;
  /**
   * Typing indicator UI component to render
   *
   * Defaults to and accepts same props as: [TypingIndicator](https://getstream.github.io/stream-chat-react-native/#typingindicator)
   */
  TypingIndicator?: React.ComponentType;
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
    additionalFlatListProps,
    disableWhileEditing = true,
    FooterComponent,
    HeaderComponent,
    InlineDateSeparator = () => null,
    InlineUnreadIndicator = DefaultInlineUnreadIndicator,
    inverted = true,
    MessageNotification = DefaultMessageNotification,
    MessageSystem = DefaultMessageSystem,
    noGroupByUser,
    onListScroll,
    onThreadSelect,
    setFlatListRef,
    threadList = false,
    TypingIndicator = DefaultTypingIndicator,
  } = props;

  const {
    channel,
    disabled,
    EmptyStateIndicator,
    initialScrollToFirstUnreadMessage,
    loading,
    LoadingIndicator,
    markRead,
    reloadChannel,
    StickyHeader,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setImages } = useImageGalleryContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    clearEditingState,
    disableTypingIndicator,
    editing,
    loadingMoreForward,
    loadMore: mainLoadMore,
    loadMoreForward: mainLoadMoreForward,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    theme: {
      messageList: { errorNotification, errorNotificationText, listContainer },
    },
  } = useTheme();
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

  const messageList = useMessageList<At, Ch, Co, Ev, Me, Re, Us>({
    inverted,
    noGroupByUser,
    threadList,
  });

  const flatListRef = useRef<DefaultFlatList<
    MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>
  > | null>(null);
  const yOffset = useRef(0);
  const [lastReceivedId, setLastReceivedId] = useState(
    getLastReceivedMessage(messageList)?.id,
  );
  const lastReceivedMessage = useRef(getLastReceivedMessage(messageList));
  const lastMessageListLength = useRef(messageList.length);
  const [newMessagesNotification, setNewMessageNotification] = useState(false);

  const messageScrollPosition = useRef(0);
  /**
   * In order to prevent the LoadingIndicator component from showing up briefly on mount,
   * we set the loading state one cycle behind to ensure the messages are set before the
   * change to the loading state is registered.
   */
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [stickyHeaderDate, setStickyHeaderDate] = useState<Date>(new Date());
  const stickyHeaderDateRef = useRef(new Date());
  const updateStickyDate = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
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

  useEffect(() => {
    if (channel && channel.countUnread() <= 4) {
      channel.markRead();
    }
  }, [channel]);

  useEffect(() => {
    setMessagesLoading(!!loading);
  }, [loading]);

  useEffect(() => {
    const currentLastMessage = getLastReceivedMessage(messageList);
    if (currentLastMessage) {
      const currentLastReceivedId = currentLastMessage.id;
      const lastReceivedId = lastReceivedMessage.current?.id;
      const currentMessageListLength = messageList.length;
      if (currentLastReceivedId) {
        const hasNewMessage =
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
          !isOwner && markRead();
        }

        setLastReceivedId(currentLastReceivedId);
        lastReceivedMessage.current = currentLastMessage;
        lastMessageListLength.current = messageList.length;
      }
    }
  }, [messageList]);

  const loadMore = threadList ? loadMoreThread : mainLoadMore;

  const renderItem = (
    message: MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>,
    index: number,
  ) => {
    if (!channel) return null;

    if (isInlineDateSeparator(message)) {
      // @ts-ignore
      return <InlineDateSeparator />;
    }

    if (isInlineUnreadIndicator(message)) {
      // @ts-ignore
      return <InlineUnreadIndicator />;
    }

    const lastRead = channel?.lastRead();

    let shouldShowUnreadLabel = false;
    let isUnread = false;
    if (
      lastRead &&
      message.created_at &&
      messageList &&
      messageList[index + 1] &&
      messageList[index + 1].created_at &&
      lastRead < message.created_at &&
      // @ts-ignore
      lastRead >= messageList[index + 1].created_at
    ) {
      shouldShowUnreadLabel = true;
    }

    if (
      lastRead &&
      message.created_at &&
      lastRead < message.created_at &&
      !(message.id === messageList[0].id && shouldShowUnreadLabel)
    ) {
      isUnread = true;
    }

    if (message.type === 'system') {
      return <MessageSystem message={message} />;
    }

    if (message.type !== 'message.read') {
      return (
        <View
          style={{
            backgroundColor: isUnread ? '#F9F9F9' : 'white',
          }}
        >
          <DefaultMessage<At, Ch, Co, Ev, Me, Re, Us>
            groupStyles={message.groupStyles as GroupType[]}
            lastReceivedId={
              lastReceivedId === message.id ? lastReceivedId : undefined
            }
            message={message}
            onThreadSelect={onThreadSelect}
            threadList={threadList}
          />
        </View>
      );
    }
    return null;
  };

  const loadMoreRecentMessages = () => {
    if (!channel?.state.isUpToDate) {
      mainLoadMoreForward();
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
      // flatListRef.current.scrollToIndex({ index: 0 });
      if (!threadList) markRead();
      await reloadChannel();
      setNewMessageNotification(false);
      flatListRef.current && flatListRef.current.scrollToIndex({ index: 0 });

      return;
    }

    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: 0 });
      setNewMessageNotification(false);
      if (!threadList) markRead();
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

  const numberOfMessagesWithImages = messagesWithImages.length;
  useEffect(() => {
    if ((threadList && thread) || (!threadList && !thread)) {
      setImages(messagesWithImages);
    }
  }, [numberOfMessagesWithImages, thread, threadList]);

  // We can't provide ListEmptyComponent to FlatList when inverted flag is set.
  // https://github.com/facebook/react-native/issues/21196
  if (messageList.length === 0 && !threadList) {
    return messagesLoading ? (
      <LoadingIndicator listType='message' />
    ) : (
      <View style={styles.flex} testID='empty-state'>
        <EmptyStateIndicator listType='message' />
      </View>
    );
  }

  const stickyHeaderFormatDate =
    stickyHeaderDate.getFullYear() === new Date().getFullYear()
      ? 'MMM D'
      : 'MMM D, YYYY';
  const tStickyHeaderDate = tDateTimeParser(stickyHeaderDate);
  const stickyHeaderDateToRender = isDayOrMoment(tStickyHeaderDate)
    ? tStickyHeaderDate.format(stickyHeaderFormatDate)
    : new Date(tStickyHeaderDate).toDateString();

  if (!FlatList) return null;
  return (
    <>
      <View collapsable={false} style={styles.container}>
        {/* @ts-ignore */}
        <FlatList
          data={messageList}
          /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
          extraData={disabled || !channel?.state.isUpToDate}
          initialScrollIndex={
            !channel?.state.isUpToDate
              ? 1
              : initialScrollToFirstUnreadMessage &&
                channel?.countUnread() > limitForUnreadScrolledUp
              ? Math.min(
                  channel?.countUnread() - 1,
                  limitForUnreadScrolledUp - 1,
                )
              : 0
          }
          inverted={inverted}
          keyboardShouldPersistTaps='handled'
          keyExtractor={keyExtractor}
          ListFooterComponent={FooterComponent}
          ListHeaderComponent={() => {
            if (HeaderComponent) {
              // @ts-ignore
              return <HeaderComponent />;
            }
            // TODO: Scrolling doesn't work perfectly with this loading indicator. Investigate and fix.
            if (Platform.OS === 'android') return null;

            if (loadingMoreForward) {
              return (
                <View style={{ padding: 10, width: '100%' }}>
                  <ActivityIndicator color={'black'} size={'small'} />
                </View>
              );
            }
            return null;
          }}
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: !channel?.state.isUpToDate ? -1000 : 10,
            minIndexForVisible: 1,
          }}
          onEndReached={loadMore}
          onScroll={handleScroll}
          onScrollToIndexFailed={() => {
            // console.log('Scroll failed --- ', info);
          }}
          onViewableItemsChanged={updateStickyDate.current}
          ref={(
            fl: MutableRefObject<
              DefaultFlatList<
                MessageOrInlineSeparator<At, Ch, Co, Ev, Me, Re, Us>
              >
            >,
          ) => {
            // @ts-ignore
            flatListRef.current = fl;

            if (setFlatListRef) {
              setFlatListRef(fl);
            }
          }}
          // @ts-ignore
          renderItem={({ index, item }) => renderItem(item, index)}
          style={[styles.listContainer, listContainer]}
          testID='message-flat-list'
          viewabilityConfig={{
            viewAreaCoveragePercentThreshold: 50,
          }}
          {...additionalFlatListProps}
        />
        <View style={styles.stickyHeader}>
          {StickyHeader ? (
            <StickyHeader dateString={stickyHeaderDateToRender} />
          ) : (
            <DateHeader dateString={stickyHeaderDateToRender} />
          )}
        </View>
        {!disableTypingIndicator && TypingIndicator && (
          <TypingIndicatorContainer<At, Ch, Co, Ev, Me, Re, Us>>
            <TypingIndicator />
          </TypingIndicatorContainer>
        )}
        <MessageNotification
          onPress={goToNewMessages}
          showNotification={newMessagesNotification}
          unreadCount={channel?.countUnread()}
        />
        {!isOnline && (
          <View
            style={[styles.errorNotification, errorNotification]}
            testID='error-notification'
          >
            <Text style={[styles.errorNotificationText, errorNotificationText]}>
              {t('Connection failure, reconnecting now...')}
            </Text>
          </View>
        )}
      </View>
      {
        // Mask for edit state
        editing && disableWhileEditing && (
          <TouchableOpacity
            onPress={clearEditingState}
            style={styles.editStateMask}
          />
        )
      }
    </>
  );
};

MessageList.displayName = 'MessageList{messageList}';
