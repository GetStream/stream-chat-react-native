import React, { useContext, useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';

import DefaultDateSeparator from './DateSeparator';
import MessageNotification from './MessageNotification';
import MessageSystem from './MessageSystem';
import DefaultTypingIndicator from './TypingIndicator';
import TypingIndicatorContainer from './TypingIndicatorContainer';

import { useMessageList } from './hooks/useMessageList';
import { getLastReceivedMessage } from './utils/getLastReceivedMessage';

import DefaultMessage from '../Message/Message';

import {
  ChannelContext,
  ChatContext,
  MessagesContext,
  ThreadContext,
  TranslationContext,
} from '../../context';

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
  const {
    actionSheetStyles,
    additionalFlatListProps = {},
    AttachmentFileIcon,
    dateSeparator,
    DateSeparator = DefaultDateSeparator,
    disableWhileEditing = true,
    dismissKeyboardOnMessageTouch = true,
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

  const { t } = useContext(TranslationContext);
  const { client, isOnline } = useContext(ChatContext);
  const {
    Attachment,
    clearEditingState,
    editing,
    emojiData,
    loadMore: mainLoadMore,
    Message,
    removeMessage,
    retrySendMessage,
    setEditingState,
    updateMessage,
  } = useContext(MessagesContext);
  const { loadMoreThread, openThread } = useContext(ThreadContext);
  const { channel, disabled, EmptyStateIndicator, markRead } = useContext(
    ChannelContext,
  );
  const messageList = useMessageList({ noGroupByUser, threadList });

  const flatListRef = useRef();
  const yOffset = useRef(0);

  const [newMessagesNotification, setNewMessageNotification] = useState(false);
  const [lastReceivedId, setLastReceivedId] = useState(
    getLastReceivedMessage(messageList) &&
      getLastReceivedMessage(messageList).id,
  );

  useEffect(() => {
    const currentLastMessage = getLastReceivedMessage(messageList);
    const currentLastReceivedId = currentLastMessage && currentLastMessage.id;
    if (currentLastReceivedId) {
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
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ index: 0 });
        }
      }

      // remove the scroll notification if we already scrolled down...
      if (scrollToBottom && newMessagesNotification) {
        setNewMessageNotification(false);
      }
      if (hasNewMessage) setLastReceivedId(currentLastReceivedId);
    }
  }, [messageList]);

  const loadMore = threadList ? mainLoadMore : loadMoreThread;

  const renderItem = ({ item: message }) => {
    if (message.type === 'message.date') {
      const DateSeparatorComponent = dateSeparator || DateSeparator;
      return <DateSeparatorComponent message={message} />;
    } else if (message.type === 'system') {
      return <MessageSystem message={message} />;
    } else if (message.type !== 'message.read') {
      return (
        <DefaultMessage
          actionSheetStyles={actionSheetStyles}
          Attachment={Attachment}
          AttachmentFileIcon={AttachmentFileIcon}
          channel={channel}
          client={client}
          disabled={disabled}
          dismissKeyboardOnMessageTouch={dismissKeyboardOnMessageTouch}
          editing={editing}
          emojiData={emojiData}
          groupStyles={message.groupStyles}
          lastReceivedId={lastReceivedId === message.id ? lastReceivedId : null}
          message={message}
          Message={Message}
          messageActions={messageActions}
          onMessageTouch={onMessageTouch}
          onThreadSelect={onThreadSelect}
          openThread={openThread}
          readBy={message.readBy}
          removeMessage={removeMessage}
          retrySendMessage={retrySendMessage}
          setEditingState={setEditingState}
          threadList={threadList}
          updateMessage={updateMessage}
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
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: 0 });
    }
    if (!threadList) markRead();
  };

  // We can't provide ListEmptyComponent to FlatList when inverted flag is set.
  // https://github.com/facebook/react-native/issues/21196
  if (messageList && messageList.length === 0 && !threadList) {
    return (
      <View style={{ flex: 1 }}>
        <EmptyStateIndicator listType='message' />
      </View>
    );
  }

  return (
    <>
      <View
        collapsable={false}
        style={{ alignItems: 'center', flex: 1, width: '100%' }}
      >
        <ListContainer
          data={messageList}
          extraData={disabled}
          inverted
          keyboardShouldPersistTaps='always'
          keyExtractor={(item) =>
            item.id ||
            item.created_at ||
            (item.date ? item.date.toISOString() : false) ||
            uuidv4()
          }
          ListFooterComponent={headerComponent || HeaderComponent}
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 10,
            minIndexForVisible: 1,
          }}
          onEndReached={loadMore}
          onScroll={handleScroll}
          /** Disables the MessageList UI. Which means, message actions, reactions won't work. */
          ref={(fl) => {
            flatListRef.current = fl;
            setFlatListRef && setFlatListRef(fl);
          }}
          renderItem={renderItem}
          testID='message-flat-list'
          {...additionalFlatListProps}
        />
        {TypingIndicator && (
          <TypingIndicatorContainer>
            <TypingIndicator client={client} />
          </TypingIndicatorContainer>
        )}
        {newMessagesNotification && (
          <MessageNotification
            onPress={goToNewMessages}
            showNotification={newMessagesNotification}
          />
        )}
        {!isOnline && (
          <ErrorNotification testID='error-notification'>
            <ErrorNotificationText>
              {t('Connection failure, reconnecting now ...')}
            </ErrorNotificationText>
          </ErrorNotification>
        )}
      </View>
      {
        // Mask for edit state
        editing && disableWhileEditing && (
          <TouchableOpacity
            collapsable={false}
            onPress={clearEditingState}
            style={{
              backgroundColor: 'black',
              height: '100%',
              opacity: 0.4,
              position: 'absolute',
              width: '100%',
              zIndex: 100,
            }}
          />
        )
      }
    </>
  );
};

MessageList.propTypes = {
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
   * Custom UI component for attachment icon for type 'file' attachment.
   * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
   */
  AttachmentFileIcon: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
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
  disableWhileEditing: PropTypes.bool,
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'reactions', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  /** Should keyboard be dismissed when messaged is touched */
  dismissKeyboardOnMessageTouch: PropTypes.bool,
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
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  /**
   * Boolean weather current message list is a thread.
   */
  /** Turn off grouping of messages by user */
  noGroupByUser: PropTypes.bool,
  /**
   * Callback for onPress event on Message component
   *
   * @param e       Event object for onPress event
   * @param message Message object which was pressed
   *
   * */
  onMessageTouch: PropTypes.func,
  /**
   * Handler to open the thread on message. This is callback for touch event for replies button.
   *
   * @param message A message object to open the thread upon.
   * */
  onThreadSelect: PropTypes.func,
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
  threadList: PropTypes.bool,
  /**
   * Typing indicator UI component to render
   *
   * Defaults to and accepts same props as: [TypingIndicator](https://getstream.github.io/stream-chat-react-native/#typingindicator)
   * */
  TypingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};

export default MessageList;
