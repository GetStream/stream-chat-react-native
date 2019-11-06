import React, { PureComponent } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { withChannelContext } from '../context';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';
import uuidv4 from 'uuid/v4';

import { Message } from './Message';
import { EventIndicator } from './EventIndicator';
import { MessageNotification } from './MessageNotification';
import { DateSeparator } from './DateSeparator';
import { TypingIndicator } from './TypingIndicator';

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

const TypingIndicatorContainer = styled.View`
  position: absolute;
  bottom: 0;
  height: 30px;
  width: 100%;
  padding-left: 16px;
  padding-top: 3px;
  padding-bottom: 3px;
  ${({ theme }) => theme.messageList.typingIndicatorContainer.css}
`;

/**
 * MessageList - The message list component renders a list of messages.
 * Its a consumer of [Channel Context](https://getstream.github.io/stream-chat-react-native/#channel)
 *
 * @example ./docs/MessageList.md
 * @extends PureComponent
 */
const MessageList = withChannelContext(
  class MessageList extends PureComponent {
    constructor(props) {
      super(props);

      this.state = {
        newMessagesNotification: false,
        online: props.online,
      };
      this.yOffset = 0;
    }

    static propTypes = {
      /** Turn off grouping of messages by user */
      noGroupByUser: PropTypes.bool,
      /**
       * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
       * If all the actions need to be disabled, empty array or false should be provided as value of prop.
       * */
      messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
      /**
       * Boolean weather current message list is a thread.
       */
      threadList: PropTypes.bool,
      /** **Available from [chat context](https://getstream.github.io/stream-chat-react-native/#chatcontext)** */
      client: PropTypes.object,
      /** **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)** */
      Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * Custom UI component for attachment icon for type 'file' attachment.
       * Defaults to: https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/FileIcon.js
       */
      AttachmentFileIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /** **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)** */
      Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /** **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)** */
      messages: PropTypes.array.isRequired,
      /** **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)** */
      read: PropTypes.object,
      /** **Available from [channel context](https://getstream.github.io/stream-chat-react-native/#channelcontext)** */
      typing: PropTypes.object,
      /** Network status */
      online: PropTypes.bool,
      disableWhileEditing: PropTypes.bool,
      /**
       * For flatlist
       * @see See loeadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
       * */
      loadMoreThreshold: PropTypes.number,
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
      eventHistory: PropTypes.object,
      /** Helper function to mark current channel as read. */
      markRead: PropTypes.func,
      /**
       * Handler to open the thread on message. This is callback for touch event for replies button.
       *
       * @param message A message object to open the thread upon.
       * */
      onThreadSelect: PropTypes.func,
      /**
       *  This method gets called when user selects edit action on some message. On code level it just sets `editing` property in state to message being edited
       *
       * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is being edited
       */
      setEditingState: PropTypes.func,
      /** Function to clear the editing state. */
      clearEditingState: PropTypes.func,
      /**
       * A message object which is currently in edit state.
       */
      editing: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
      loadMore: PropTypes.func,
      /**
       * Typing indicator UI component to render
       *
       * Defaults to and accepts same props as: [TypingIndicator](https://getstream.github.io/stream-chat-react-native/#typingindicator)
       * */
      TypingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * @deprecated User DateSeperator instead.
       * Date separator UI component to render
       *
       * Defaults to and accepts same props as: [DateSeparator](https://getstream.github.io/stream-chat-react-native/#dateseparator)
       * */
      dateSeparator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * Date separator UI component to render
       *
       * Defaults to and accepts same props as: [DateSeparator](https://getstream.github.io/stream-chat-react-native/#dateseparator)
       * */
      DateSeparator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
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
      eventIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * UI Component to display following events in messagelist
       *
       * 1. member.added
       * 2. member.removed
       *
       * Defaults to and accepts same props as: [EventIndicator](https://getstream.github.io/stream-chat-react-native/#eventindicator)
       * */
      EventIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),

      /** UI component for empty message list */
      EmptyStateIndicator: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.func,
      ]),
      /**
       * @deprecated Use HeaderComponent instead.
       *
       * UI component for header of message list.
       */
      headerComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * UI component for header of message list. By default message list doesn't have any header.
       * This is basically a [ListFooterComponent](https://facebook.github.io/react-native/docs/flatlist#listheadercomponent) of FlatList
       * used in MessageList. Its footer instead of header, since message list is inverted.
       *
       */
      HeaderComponent: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      /**
       * Style object for actionsheet (used to message actions).
       * Supported styles: https://github.com/beefe/react-native-actionsheet/blob/master/lib/styles.js
       */
      actionSheetStyles: PropTypes.object,
    };

    static defaultProps = {
      DateSeparator,
      EventIndicator,
      disableWhileEditing: true,
      // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
      loadMoreThreshold: 2,
      messageGrouping: true,
      dismissKeyboardOnMessageTouch: true,
      TypingIndicator,
    };

    componentDidUpdate(prevProps) {
      if (this.props.online !== prevProps.online) {
        this.setState({ online: this.props.online });
      }

      // handle new messages being sent/received
      const currentLastMessage = this.props.messages[
        this.props.messages.length - 1
      ];
      const previousLastMessage =
        prevProps.messages[prevProps.messages.length - 1];
      if (!previousLastMessage || !currentLastMessage) {
        return;
      }

      const hasNewMessage = currentLastMessage.id !== previousLastMessage.id;
      const userScrolledUp = this.yOffset > 0;
      const isOwner = currentLastMessage.user.id === this.props.client.userID;

      let scrollToBottom = false;

      // always scroll down when it's your own message that you added...
      if (hasNewMessage && isOwner) {
        scrollToBottom = true;
      } else if (hasNewMessage && !userScrolledUp) {
        scrollToBottom = true;
      }

      // Check the scroll position... if you're scrolled up show a little notification
      if (
        !scrollToBottom &&
        hasNewMessage &&
        !this.state.newMessagesNotification
      ) {
        this.setState({ newMessagesNotification: true });
      }

      if (scrollToBottom) {
        this.flatList.scrollToIndex({ index: 0 });
      }

      // remove the scroll notification if we already scrolled down...
      if (scrollToBottom && this.state.newMessagesNotification) {
        this.setState({ newMessagesNotification: false });
      }

      this.getLastReceived(this.props.messages);
    }

    insertDates = (messages) => {
      const newMessages = [];

      for (const [i, message] of messages.entries()) {
        if (message.type === 'message.read' || message.deleted_at) {
          newMessages.push(message);
          continue;
        }

        const messageDate = message.created_at.getDay();
        let prevMessageDate = messageDate;

        if (i < messages.length - 1) {
          prevMessageDate = messages[i + 1].created_at.getDay();
        }

        if (i === 0) {
          newMessages.push(
            {
              type: 'message.date',
              date: message.created_at,
            },
            message,
          );
        } else if (messageDate !== prevMessageDate) {
          newMessages.push(message, {
            type: 'message.date',
            date: messages[i + 1].created_at,
          });
        } else {
          newMessages.push(message);
        }

        const eventsNextToMessage = this.props.eventHistory[message.id];
        if (eventsNextToMessage && eventsNextToMessage.length > 0) {
          eventsNextToMessage.forEach((e) => {
            newMessages.push({
              type: 'channel.event',
              event: e,
            });
          });
        }
      }

      return newMessages;
    };

    getGroupStyles = (m) => {
      const l = m.length;
      const messageGroupStyles = {};

      const messages = [...m];

      for (let i = 0; i < l; i++) {
        const previousMessage = messages[i - 1];
        const message = messages[i];
        const nextMessage = messages[i + 1];
        const groupStyles = [];

        if (message.type === 'channel.event') {
          continue;
        }

        if (message.type === 'message.date') {
          continue;
        }

        const userId = message.user ? message.user.id : null;

        const isTopMessage =
          !previousMessage ||
          previousMessage.type === 'message.date' ||
          previousMessage.type === 'system' ||
          previousMessage.type === 'channel.event' ||
          (previousMessage.attachments &&
            previousMessage.attachments.length !== 0) ||
          userId !== previousMessage.user.id ||
          previousMessage.type === 'error' ||
          previousMessage.deleted_at;

        const isBottomMessage =
          !nextMessage ||
          nextMessage.type === 'message.date' ||
          nextMessage.type === 'system' ||
          nextMessage.type === 'channel.event' ||
          (nextMessage.attachments && nextMessage.attachments.length !== 0) ||
          userId !== nextMessage.user.id ||
          nextMessage.type === 'error' ||
          nextMessage.deleted_at;

        if (isTopMessage) {
          groupStyles.push('top');
        }

        if (isBottomMessage) {
          if (isTopMessage || message.deleted_at || message.type === 'error') {
            groupStyles.splice(0, groupStyles.length);
            groupStyles.push('single');
          } else {
            groupStyles.push('bottom');
          }
        }

        if (!isTopMessage && !isBottomMessage) {
          if (message.deleted_at || message.type === 'error') {
            groupStyles.splice(0, groupStyles.length);
            groupStyles.push('single');
          } else {
            groupStyles.splice(0, groupStyles.length);
            groupStyles.push('middle');
          }
        }

        if (message.attachments.length !== 0) {
          groupStyles.splice(0, groupStyles.length);
          groupStyles.push('single');
        }

        if (this.props.noGroupByUser) {
          groupStyles.splice(0, groupStyles.length);
          groupStyles.push('single');
        }

        messageGroupStyles[message.id] = groupStyles;
      }

      return messageGroupStyles;
    };

    goToNewMessages = () => {
      this.setState({
        newMessagesNotification: false,
      });
      this.flatList.scrollToIndex({ index: 0 });
      if (!this.props.threadList) this.props.markRead();
    };

    getLastReceived = (messages) => {
      const l = messages.length;
      let lastReceivedId = null;
      for (let i = l; i > 0; i--) {
        if (
          messages[i] !== undefined &&
          messages[i].status !== undefined &&
          messages[i].status === 'received'
        ) {
          lastReceivedId = messages[i].id;
          break;
        }
      }
      this.setState({ lastReceivedId });
    };

    getReadStates = (messages) => {
      // create object with empty array for each message id
      const readData = {};

      for (const message of messages) {
        readData[message.id] = [];
      }

      for (const readState of Object.values(this.props.read)) {
        if (readState.last_read == null) {
          break;
        }
        let userLastReadMsgId;
        for (const msg of messages) {
          if (msg.updated_at < readState.last_read) {
            userLastReadMsgId = msg.id;
          }
        }
        if (userLastReadMsgId != null) {
          readData[userLastReadMsgId] = [
            ...readData[userLastReadMsgId],
            readState.user,
          ];
        }
      }
      return readData;
    };

    renderItem = (message, groupStyles) => {
      if (message.type === 'message.date') {
        const DateSeparator =
          this.props.dateSeparator || this.props.DateSeparator;
        return <DateSeparator message={message} />;
      } else if (message.type === 'channel.event') {
        const EventIndicator =
          this.props.eventIndicator || this.props.EventIndicator;
        return <EventIndicator event={message.event} />;
      } else if (message.type !== 'message.read') {
        const readBy = this.readData[message.id] || [];
        return (
          <Message
            client={this.props.client}
            channel={this.props.channel}
            onThreadSelect={this.props.onThreadSelect}
            message={message}
            groupStyles={groupStyles}
            Message={this.props.Message}
            Attachment={this.props.Attachment}
            readBy={readBy}
            lastReceivedId={
              this.state.lastReceivedId === message.id
                ? this.state.lastReceivedId
                : null
            }
            onMessageTouch={this.props.onMessageTouch}
            dismissKeyboardOnMessageTouch={
              this.props.dismissKeyboardOnMessageTouch
            }
            setEditingState={this.props.setEditingState}
            editing={this.props.editing}
            threadList={this.props.threadList}
            messageActions={this.props.messageActions}
            updateMessage={this.props.updateMessage}
            removeMessage={this.props.removeMessage}
            retrySendMessage={this.props.retrySendMessage}
            openThread={this.props.openThread}
            emojiData={this.props.emojiData}
            actionSheetStyles={this.props.actionSheetStyles}
            AttachmentFileIcon={this.props.AttachmentFileIcon}
          />
        );
      }
    };

    handleScroll = (event) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const removeNewMessageNotification = yOffset <= 0;
      if (
        !this.props.threadList &&
        removeNewMessageNotification &&
        this.props.channel.countUnread() > 0
      )
        this.props.markRead();

      this.yOffset = yOffset;
      this.setState((prevState) => ({
        newMessagesNotification: removeNewMessageNotification
          ? false
          : prevState.newMessagesNotification,
      }));
    };

    renderEmptyState = () => {
      const Indicator = this.props.EmptyStateIndicator;
      return <Indicator listType="message" />;
    };

    render() {
      // We can't provide ListEmptyComponent to FlatList when inverted flag is set.
      // https://github.com/facebook/react-native/issues/21196
      if (
        this.props.messages &&
        this.props.messages.length === 0 &&
        !this.props.threadList
      ) {
        return <View style={{ flex: 1 }}>{this.renderEmptyState()}</View>;
      }

      const TypingIndicator = this.props.TypingIndicator;
      const HeaderComponent =
        this.props.headerComponent || this.props.HeaderComponent;
      const messagesWithDates = this.insertDates(this.props.messages);
      const messageGroupStyles = this.getGroupStyles(messagesWithDates);
      this.readData = this.getReadStates(messagesWithDates);
      messagesWithDates.reverse();

      const typing = Object.values(this.props.typing);
      let showTypingIndicator;
      if (
        typing.length === 0 ||
        (typing.length === 1 && typing[0].user.id === this.props.client.user.id)
      ) {
        showTypingIndicator = false;
      } else {
        showTypingIndicator = true;
      }

      return (
        <React.Fragment>
          {// Mask for edit state
          this.props.editing && this.props.disableWhileEditing && (
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
              onPress={this.props.clearEditingState}
            />
          )}
          <View
            collapsable={false}
            style={{ flex: 1, alignItems: 'center', width: '100%' }}
          >
            <ListContainer
              ref={(fl) => (this.flatList = fl)}
              data={messagesWithDates}
              onScroll={this.handleScroll}
              ListFooterComponent={HeaderComponent}
              onEndReached={this.props.loadMore}
              inverted
              keyboardShouldPersistTaps="always"
              keyExtractor={(item) =>
                item.id ||
                item.created_at ||
                (item.date ? item.date.toISOString() : false) ||
                uuidv4()
              }
              renderItem={({ item: message }) =>
                this.renderItem(message, messageGroupStyles[message.id])
              }
              maintainVisibleContentPosition={{
                minIndexForVisible: 1,
                autoscrollToTopThreshold: 10,
              }}
            />
            <TypingIndicatorContainer>
              {this.props.TypingIndicator && showTypingIndicator && (
                <TypingIndicator
                  typing={this.props.typing}
                  client={this.props.client}
                />
              )}
            </TypingIndicatorContainer>
            {this.state.newMessagesNotification && (
              <MessageNotification
                showNotification={this.state.newMessagesNotification}
                onClick={this.goToNewMessages}
              />
            )}
            {!this.state.online && (
              <ErrorNotification>
                <ErrorNotificationText>
                  Connection failure, reconnecting now ...
                </ErrorNotificationText>
              </ErrorNotification>
            )}
          </View>
        </React.Fragment>
      );
    }
  },
);

export { MessageList };
