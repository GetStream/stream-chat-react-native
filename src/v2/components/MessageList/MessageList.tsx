import React, { MutableRefObject, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList as DefaultFlatList,
  FlatListProps,
  Platform,
  ScrollViewProps,
  StyleSheet,
  Text,
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

import { useAttachmentPickerContext } from '../../contexts/attachmentPickerContext/AttachmentPickerContext';
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
import type { Attachment } from 'stream-chat';

import { FlatList } from '../../native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FCFCFC',
    flex: 1,
    width: '100%',
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
    width: '100%',
  },
  messagePadding: {
    paddingHorizontal: 8,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
  },
  targettedMessageUnderlay: {
    backgroundColor: '#FBF4DD',
  },
  unreadMessageUnderlay: {
    backgroundColor: '#F9F9F9',
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
) =>
  item.id ||
  (item.created_at
    ? typeof item.created_at === 'string'
      ? item.created_at
      : item.created_at.toISOString()
    : Date.now().toString());

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
      Message<At, Ch, Co, Ev, Me, Re, Us>
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
    FooterComponent,
    HeaderComponent,
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
    loadChannelAtMessage,
    loading,
    LoadingIndicator,
    markRead,
    reloadChannel,
    setTargettedMessage,
    StickyHeader,
    targettedMessage,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { client, isOnline } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { setImages } = useImageGalleryContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    disableTypingIndicator,
    loadingMoreForward,
    loadMoreEarlier,
    loadMoreRecent,
  } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();
  const {
    theme: {
      messageList: {
        container,
        errorNotification,
        errorNotificationText,
        listContainer,
      },
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
  const {
    closePicker,
    selectedPicker,
    setSelectedPicker,
  } = useAttachmentPickerContext();

  const messageList = useMessageList<At, Ch, Co, Ev, Me, Re, Us>({
    inverted,
    noGroupByUser,
    threadList,
  });

  const [autoscrollToTopThreshold, setAutoscrollToTopThreshold] = useState(
    !channel?.state.isUpToDate ? -1000 : 10,
  );

  const flatListRef = useRef<DefaultFlatList<
    Message<At, Ch, Co, Ev, Me, Re, Us>
  > | null>(null);
  const yOffset = useRef(0);

  const [hasMoved, setHasMoved] = useState(false);
  const [lastReceivedId, setLastReceivedId] = useState(
    getLastReceivedMessage(messageList)?.id,
  );
  const lastMessageListLength = useRef(channel?.state.messages.length);
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
          !isOwner && markRead();
        }

        setLastReceivedId(currentLastReceivedId);
        lastMessageListLength.current = channel?.state.messages.length;
      }
    }
  }, [messageList]);

  useEffect(() => {
    // Lets wait so that list gets rendered, before we update autoscrollToTopThreshold,
    setTimeout(() => {
      setAutoscrollToTopThreshold(!channel?.state.isUpToDate ? -1000 : 10);
    });
  }, [messageList]);

  const renderItem = (
    message: Message<At, Ch, Co, Ev, Me, Re, Us>,
    index: number,
  ) => {
    if (!channel) return null;

    const lastRead = channel?.lastRead();

    let insertInlineUnreadIndicator = false;
    let isUnread = false;
    if (
      lastRead &&
      message.created_at &&
      messageList &&
      messageList[index + 1] &&
      messageList[index + 1].created_at &&
      lastRead <= message.created_at &&
      // @ts-ignore
      lastRead > messageList[index + 1].created_at
    ) {
      insertInlineUnreadIndicator = true;
    }

    if (
      lastRead &&
      message.created_at &&
      lastRead < message.created_at &&
      !(message.id === messageList[0].id && insertInlineUnreadIndicator)
    ) {
      isUnread = true;
    }

    if (message.type === 'system') {
      return (
        <>
          <View style={styles.messagePadding}>
            <MessageSystem message={message} />
          </View>
          {insertInlineUnreadIndicator && <InlineUnreadIndicator />}
        </>
      );
    }

    if (message.type !== 'message.read') {
      const additionalStyles = [];
      if (targettedMessage === message.id) {
        additionalStyles.push(styles.targettedMessageUnderlay);
      }

      if (isUnread && newMessagesNotification) {
        additionalStyles.push(styles.unreadMessageUnderlay);
      }

      return (
        <>
          <View style={[styles.messagePadding, ...additionalStyles]}>
            <DefaultMessage<At, Ch, Co, Ev, Me, Re, Us>
              goToMessage={goToMessage}
              groupStyles={message.groupStyles as GroupType[]}
              lastReceivedId={
                lastReceivedId === message.id ? lastReceivedId : undefined
              }
              message={message}
              onThreadSelect={onThreadSelect}
              threadList={threadList}
            />
          </View>
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

  const goToMessage = (messageId: string) => {
    const indexOfParentInViewable = viewableMessages.current.indexOf(messageId);

    if (indexOfParentInViewable > -1) {
      const indexOfParentInMessageList = messageList.findIndex(
        (m) => m && m.id === messageId,
      );
      flatListRef.current &&
        flatListRef.current.scrollToIndex({
          index: indexOfParentInMessageList - 1,
        });

      setTargettedMessage(messageId);
    } else {
      loadChannelAtMessage(messageId);
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
  useEffect(() => {
    if ((threadList && thread) || (!threadList && !thread)) {
      setImages(messagesWithImages);
    }
  }, [imageString, numberOfMessagesWithImages, thread, threadList]);

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

  const dismissImagePicker = () => {
    if (!hasMoved && selectedPicker) {
      setSelectedPicker(undefined);
      closePicker();
    }
  };

  return (
    <View collapsable={false} style={[styles.container, container]}>
      {/* @ts-ignore */}
      <FlatList
        data={messageList}
        /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
        extraData={disabled || !channel?.state.isUpToDate}
        initialScrollIndex={
          !channel?.state.isUpToDate
            ? 0
            : initialScrollToFirstUnreadMessage &&
              channel?.countUnread() > limitForUnreadScrolledUp
            ? Math.min(channel?.countUnread() - 1, limitForUnreadScrolledUp - 1)
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
          autoscrollToTopThreshold,
          minIndexForVisible: 1,
        }}
        onEndReached={threadList ? loadMoreThread : loadMoreEarlier}
        onScroll={handleScroll}
        onScrollBeginDrag={() => setHasMoved(true)}
        onScrollEndDrag={() => setHasMoved(false)}
        onTouchEnd={dismissImagePicker}
        onViewableItemsChanged={updateStickyDate.current}
        ref={(
          fl: MutableRefObject<
            DefaultFlatList<Message<At, Ch, Co, Ev, Me, Re, Us>>
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
  );
};
