import React, { PureComponent } from 'react';
import { View, Text, FlatList } from 'react-native';
import { withChannelContext } from '../context';

import PropTypes from 'prop-types';
import { styles } from '../styles/styles.js';

import { Message } from './Message';
import { MessageNotification } from './MessageNotification';
import { DateSeparator } from './DateSeparator';

const MessageList = withChannelContext(
  class MessageList extends PureComponent {
    constructor(props) {
      super(props);

      this.state = {
        newMessagesNotification: false,
        activeMessageId: false,
        online: props.online,
      };
    }

    static propTypes = {
      /** A list of immutable messages */
      messages: PropTypes.array.isRequired,
      /** Turn off grouping of messages by user */
      noGroupByUser: PropTypes.bool,
      online: PropTypes.bool,
      /** The message rendering component, the Message component delegates its rendering logic to this component */
      Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
      dateSeparator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    };

    static defaultProps = {
      dateSeparator: DateSeparator,
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
      const userScrolledUp = this.state.yOffset > 0;
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
      }

      return newMessages;
    };

    assignGroupPositions = (m) => {
      const l = m.length;
      const newMessages = [];
      const messages = [...m];

      for (let i = 0; i < l; i++) {
        const previousMessage = messages[i - 1];
        const message = messages[i];
        const nextMessage = messages[i + 1];
        const groupStyles = [];
        if (message.type === 'message.date') {
          newMessages.unshift({ ...message, groupPosition: [] });
          continue;
        }
        const userId = message.user.id;

        const isTopMessage =
          !previousMessage ||
          previousMessage.type === 'message.date' ||
          previousMessage.attachments.length !== 0 ||
          userId !== previousMessage.user.id ||
          previousMessage.type === 'error' ||
          previousMessage.deleted_at;

        const isBottomMessage =
          !nextMessage ||
          nextMessage.type === 'message.date' ||
          nextMessage.attachments.length !== 0 ||
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

        newMessages.unshift({ ...message, groupPosition: groupStyles });
      }

      return newMessages;
    };

    goToNewMessages = () => {
      this.setState({
        newMessagesNotification: false,
      });
      this.flatList.scrollToIndex({ index: 0 });
      this.props.markRead();
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

    renderItem = ({ item: message }) => {
      if (message.type === 'message.date') {
        const DateSeparator = this.props.dateSeparator;
        return <DateSeparator message={message} />;
      }

      return (
        <Message
          onThreadSelect={this.props.onThreadSelect}
          message={message}
          Message={this.props.Message}
          lastReceivedId={
            this.state.lastReceivedId === message.id
              ? this.state.lastReceivedId
              : null
          }
          onMessageTouch={this.onMessageTouch}
          activeMessageId={this.state.activeMessageId}
          setEditingState={this.props.setEditingState}
          editing={this.props.editing}
          threadList={this.props.threadList}
          messageActions={this.props.messageActions}
        />
      );
    };

    handleScroll = (event) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const removeNewMessageNotification = yOffset <= 0;

      if (removeNewMessageNotification) this.props.markRead();

      this.setState((prevState) => ({
        yOffset,
        newMessagesNotification: removeNewMessageNotification
          ? false
          : prevState.newMessagesNotification,
      }));
    };

    onMessageTouch = (id) => {
      this.setState({ activeMessageId: id });
    };

    renderEmptyState = () => {
      const Indicator = this.props.EmptyStateIndicator;
      return <Indicator listType="message" />;
    };

    render() {
      // We can't provide ListEmptyComponent to FlatList when inverted flag is set.
      // https://github.com/facebook/react-native/issues/21196
      if (this.props.messages && this.props.messages.length === 0) {
        return <View style={{ flex: 1 }}>{this.renderEmptyState()}</View>;
      }

      const messagesWithDates = this.insertDates(this.props.messages);
      const messagesWithGroupPositions = this.assignGroupPositions(
        messagesWithDates,
      );

      return (
        <View collapsable={false} style={{ flex: 1, alignItems: 'center' }}>
          <FlatList
            ref={(fl) => (this.flatList = fl)}
            style={{
              flex: 1,
              paddingLeft: 10,
              paddingRight: 10,
              width: '100%',
            }}
            data={messagesWithGroupPositions}
            onScroll={this.handleScroll}
            ListFooterComponent={this.props.headerComponent}
            onEndReached={this.props.loadMore}
            inverted
            keyExtractor={(item) =>
              item.id || item.created_at || item.date.toISOString()
            }
            renderItem={this.renderItem}
            maintainVisibleContentPosition={{
              minIndexForVisible: 1,
              autoscrollToTopThreshold: 10,
            }}
          />
          <MessageNotification
            showNotification={this.state.newMessagesNotification}
            onClick={this.goToNewMessages}
          >
            <View
              style={{
                borderRadius: 10,
                backgroundColor: 'black',
                color: 'white',
                padding: 10,
              }}
            >
              <Text style={{ color: 'white' }}>New Messages ↓</Text>
            </View>
          </MessageNotification>
          <Notification type="warning" active={!this.state.online}>
            <Text style={styles.Notification.warning}>
              Connection failure, reconnecting now ...
            </Text>
          </Notification>
        </View>
      );
    }
  },
);

const Notification = ({ children, active, type }) => {
  if (active) {
    return (
      <View
        style={{
          ...styles.Notification.container,
          ...styles.Notification[type],
        }}
      >
        {children}
      </View>
    );
  }

  return null;
};

export { MessageList };
