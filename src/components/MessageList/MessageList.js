import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import styled from '@stream-io/styled-components';
import { v4 as uuidv4 } from 'uuid';

import { ChannelContext, ChatContext, TranslationContext } from '../../context';
import DefaultDateSeparator from './DateSeparator';
import DefaultEventIndicator from './EventIndicator';
import { Message as DefaultMessage } from '../Message';
import MessageNotification from './MessageNotification';
import MessageSystem from './MessageSystem';
import DefaultTypingIndicator from './TypingIndicator';
import TypingIndicatorContainer from './TypingIndicatorContainer';
import {
  getGroupStyles,
  getLastReceivedId,
  getReadStates,
  insertDates,
} from './utils';

const ListContainer = styled.FlatList`
  flex: 1;
  width: 100%;
  padding-left: 10px;
  padding-right: 10px;
  ${({ theme }) => theme.messageList.listContainer.css}
`;

const ErrorNotificationText = styled.Text`
  color: red;
  background-color: #fae6e8;
  ${({ theme }) => theme.messageList.errorNotificationText.css}
`;

const ErrorNotification = styled.View`
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  margin-bottom: 0;
  padding: 5px;
  color: red;
  background-color: #fae6e8;
  ${({ theme }) => theme.messageList.errorNotification.css}
`;

/**
 * MessageList - The message list component renders a list of messages.
 * Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react-native/#channel)
 *
 * @example ../docs/MessageList.md
 */
const MessageList = (props) => {
  const { t } = useContext(TranslationContext);
  const { client } = useContext(ChatContext);
  const {
    Attachment,
    channel,
    clearEditingState,
    disabled,
    editing,
    emojiData,
    EmptyStateIndicator,
    loadMore,
    markRead,
    Message,
    messages
    online,
    openThread,
    read,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
  } = useContext(ChannelContext);
  const flatListRef = useRef();
  const yOffset = useRef(0);

  const {
    actionSheetStyles,
    additionalFlatListProps = {},
    AttachmentFileIcon,
    dateSeparator,
    DateSeparator = DefaultDateSeparator,
    disableWhileEditing = true,
    dismissKeyboardOnMessageTouch = true,
    eventIndicator,
    EventIndicator = DefaultEventIndicator,
    headerComponent,
    HeaderComponent,
    messageActions,
    noGroupByUser,
    onMessageTouch,
    onThreadSelect,
    setFlatListRef,
    threadList,
    TypingIndicator = DefaultTypingIndicator,
  } = props;

  const [newMessagesNotification, setNewMessageNotification] = useState(false);
  const [lastReceivedId, setLastReceivedId] = useState(
    getLastReceivedId(messages),
  );

  useEffect(() => {
    const currentLastReceivedId = getLastReceivedId(messages);
    const currentLastMessage = messages[messages.length - 1];
    if (lastReceivedId && currentLastReceivedId) {
      const hasNewMessage = lastReceivedId !== currentLastReceivedId;
      const userScrolledUp = yOffset.current > 0;
      const isOwner = currentLastMessage.user.id === client.userID;

      // always scroll down when it's your own message that you added..
      const scrollToBottom =
        (hasNewMessage && isOwner) || (hasNewMessage && !userScrolledUp);

      // Check the scroll position... if you're scrolled up show a little notification
      if (!scrollToBottom && hasNewMessage && !newMessagesNotification) {
        setNewMessageNotification(true);
      }
      if (scrollToBottom) {
        flatListRef.current?.scrollToIndex({ index: 0 });
      }

      // remove the scroll notification if we already scrolled down...
      if (scrollToBottom && newMessagesNotification) {
        setNewMessageNotification(false);
      }
      if (hasNewMessage) setLastReceivedId(currentLastReceivedId);
    }
  }, [messages]);

  const renderItem = ({ item: message }) => {
    if (message.type === 'message.date') {
      const DateSeparatorComponent = dateSeparator || DateSeparator;
      return <DateSeparatorComponent message={message} />;
    } else if (message.type === 'channel.event') {
      const EventIndicatorComponent = eventIndicator || EventIndicator;
      return <EventIndicatorComponent event={message.event} />;
    } else if (message.type === 'system') {
      return <MessageSystem message={message} />;
    } else if (message.type !== 'message.read') {
      return (
        <DefaultMessage
          client={client}
          channel={channel}
          onThreadSelect={onThreadSelect}
          message={message}
          groupStyles={message.groupStyles}
          Message={Message}
          Attachment={Attachment}
          readBy={message.readBy}
          disabled={disabled}
          lastReceivedId={lastReceivedId === message.id ? lastReceivedId : null}
          onMessageTouch={onMessageTouch}
          dismissKeyboardOnMessageTouch={dismissKeyboardOnMessageTouch}
          setEditingState={setEditingState}
          editing={editing}
          threadList={threadList}
          messageActions={messageActions}
          updateMessage={updateMessage}
          removeMessage={removeMessage}
          retrySendMessage={retrySendMessage}
          openThread={openThread}
          emojiData={emojiData}
          actionSheetStyles={actionSheetStyles}
          AttachmentFileIcon={AttachmentFileIcon}
        />
      );
    }
  };

  const handleScroll = (event) => {
    const y = event.nativeEvent.contentOffset.y;
    const removeNewMessageNotification = y <= 0;
    if (
      !threadList &&
      removeNewMessageNotification &&
      channel.countUnread() > 0
    )
      markRead();

    yOffset.current = y;
    if (removeNewMessageNotification) {
      setNewMessageNotification(false);
    }
  };

  const goToNewMessages = () => {
    setNewMessageNotification(false);
    flatListRef.current?.scrollToIndex({ index: 0 });
    if (!threadList) markRead();
  };

  // We can't provide ListEmptyComponent to FlatList when inverted flag is set.
  // https://github.com/facebook/react-native/issues/21196
  if (messages && messages.length === 0 && !threadList) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyStateIndicator listType='message' />
      </View>
    );
  }

  const messagesWithDates = insertDates(messages);
  const messageGroupStyles = getGroupStyles(messagesWithDates, noGroupByUser);
  const readData = getReadStates(messagesWithDates, read);

  const messageList = messagesWithDates
    .map((msg) => ({
      ...msg,
      readBy: readData[msg.id] || [],
      groupStyles: messageGroupStyles[msg.id],
    }))
    .reverse();

  return (
    <>
      {// Mask for edit state
      editing && disableWhileEditing && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            backgroundColor: 'black',
            opacity: 0.4,
            height: '100%',
            width: '100%',
            zIndex: 100,
          }}
          collapsable={false}
          onPress={clearEditingState}
        />
      )}
      <View
        collapsable={false}
        style={{ flex: 1, alignItems: 'center', width: '100%' }}
      >
        <ListContainer
          ref={(fl) => {
            flatListRef.current = fl;
            setFlatListRef && setFlatListRef(fl);
          }}
          data={messageList}
          onScroll={handleScroll}
          ListFooterComponent={headerComponent || HeaderComponent}
          onEndReached={loadMore}
          inverted
          keyboardShouldPersistTaps='always'
          keyExtractor={(item) =>
            item.id ||
            item.created_at ||
            (item.date ? item.date.toISOString() : false) ||
            uuidv4()
          }
          renderItem={renderItem}
          /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
          extraData={disabled}
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
            autoscrollToTopThreshold: 10,
          }}
          {...additionalFlatListProps}
        />
        {TypingIndicator && (
          <TypingIndicatorContainer>
            <TypingIndicator client={client} />
          </TypingIndicatorContainer>
        )}
        {newMessagesNotification && (
          <MessageNotification
            showNotification={newMessagesNotification}
            onPress={goToNewMessages}
          />
        )}
        {!online && (
          <ErrorNotification>
            <ErrorNotificationText>
              {t('Connection failure, reconnecting now ...')}
            </ErrorNotificationText>
          </ErrorNotification>
        )}
      </View>
    </>
  );
};

MessageList.propTypes = {
  /** Turn off grouping of messages by user */
  noGroupByUser: PropTypes.bool,
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  /**
   * Boolean weather current message list is a thread.
   */
  threadList: PropTypes.bool,
  /**
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  disableWhileEditing: PropTypes.bool,
  /**
   * Callback for onPress event on Message component
   *
   * @param e       Event object for onPress event
   * @param message Message object which was pressed
   *
   * */
  onMessageTouch: PropTypes.func,
  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch: PropTypes.bool,
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   * */
  onThreadSelect: PropTypes.func,
  /**
   * Typing indicator UI component to render
   *
   * Defaults to and accepts same props as: [TypingIndicator](https://getstream.github.io/stream-chat-react-native/#typingindicator)
   * */
  TypingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * @deprecated User DateSeperator instead.
   * Date separator UI component to render
   *
   * Defaults to and accepts same props as: [DateSeparator](https://getstream.github.io/stream-chat-react-native/#dateseparator)
   * */
  dateSeparator: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Date separator UI component to render
   *
   * Defaults to and accepts same props as: [DateSeparator](https://getstream.github.io/stream-chat-react-native/#dateseparator)
   * */
  DateSeparator: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * @deprecated User EventIndicator instead.
   *
   * UI Component to display following events in messagelist
   *
   * 1. member.added
   * 2. member.removed
   *
   * Defaults to and accepts same props as: [EventIndicator](https://getstream.github.io/stream-chat-react-native/#eventindicator)
   * */
  eventIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * UI Component to display following events in messagelist
   *
   * 1. member.added
   * 2. member.removed
   *
   * Defaults to and accepts same props as: [EventIndicator](https://getstream.github.io/stream-chat-react-native/#eventindicator)
   * */
  EventIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * @deprecated Use HeaderComponent instead.
   *
   * UI component for header of message list.
   */
  headerComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * UI component for header of message list. By default message list doesn't have any header.
   * This is basically a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
   * used in MessageList. Its footer instead of header, since message list is inverted.
   *
   */
  HeaderComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Style object for actionsheet (used to message actions).
   * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
   */
  actionSheetStyles: PropTypes.object,
  /**
   * Besides existing (default) UX behaviour of underlying flatlist of MessageList component, if you want
   * to attach some additional props to un derlying flatlist, you can add it to following prop.
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
  additionalFlatListProps: PropTypes.object,
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
  setFlatListRef: PropTypes.func,
};

export default MessageList;
