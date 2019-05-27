import React, { PureComponent } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { withChannelContext } from '../context';
import styled from '@stream-io/styled-components';
import PropTypes from 'prop-types';

import { Message } from './Message';
import { MessageNotification } from './MessageNotification';
import { DateSeparator } from './DateSeparator';

const ListContainer = styled.FlatList`
  flex: ${(props) => props.theme.messageList.listContainer.flex};
  width: 100%;
  padding-left: ${(props) => props.theme.messageList.listContainer.paddingLeft};
  padding-right: ${(props) =>
    props.theme.messageList.listContainer.paddingRight};
`;

const NewMessageNotification = styled.View`
  border-radius: ${(props) =>
    props.theme.messageList.newMessageNotification.borderRadius};
  background-color: ${(props) =>
    props.theme.messageList.newMessageNotification.backgroundColor};
  color: ${(props) => props.theme.messageList.newMessageNotification.color};
  padding: ${(props) =>
    props.theme.messageList.newMessageNotification.padding}px;
`;
const NewMessageNotificationText = styled.Text`
  color: ${(props) => props.theme.messageList.newMessageNotificationText.color};
`;

const NotificationText = styled.Text`
  color: ${(props) => props.theme.messageList.notification.warning.color};
  background-color: ${(props) =>
    props.theme.messageList.notification.warning.backgroundColor};
`;

const MessageList = withChannelContext(
  class MessageList extends PureComponent {
    constructor(props) {
      super(props);

      this.state = {
        newMessagesNotification: false,
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
      disableWhileEditing: PropTypes.bool,
      /** For flatlist  */
      loadMoreThreshold: PropTypes.number,
    };

    static defaultProps = {
      dateSeparator: DateSeparator,
      disableWhileEditing: true,
      // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
      loadMoreThreshold: 2,
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

      if (!this.props.threadList && removeNewMessageNotification)
        this.props.markRead();

      this.setState((prevState) => ({
        yOffset,
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
      if (this.props.messages && this.props.messages.length === 0) {
        return <View style={{ flex: 1 }}>{this.renderEmptyState()}</View>;
      }

      const messagesWithDates = this.insertDates(this.props.messages);
      const messagesWithGroupPositions = this.assignGroupPositions(
        messagesWithDates,
      );

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
              data={messagesWithGroupPositions}
              onScroll={this.handleScroll}
              ListFooterComponent={this.props.headerComponent}
              onEndReached={this.props.loadMore}
              inverted
              keyboardShouldPersistTaps="always"
              keyExtractor={(item) =>
                item.id || item.created_at || item.date.toISOString()
              }
              renderItem={this.renderItem}
              maintainVisibleContentPosition={{
                minIndexForVisible: 1,
                autoscrollToTopThreshold: 10,
              }}
            />
            {this.state.newMessagesNotification && (
              <MessageNotification
                showNotification={this.state.newMessagesNotification}
                onClick={this.goToNewMessages}
              >
                <NewMessageNotification>
                  <NewMessageNotificationText>
                    New Messages ↓
                  </NewMessageNotificationText>
                </NewMessageNotification>
              </MessageNotification>
            )}
            <Notification type="warning" active={!this.state.online}>
              <NotificationText>
                Connection failure, reconnecting now ...
              </NotificationText>
            </Notification>
          </View>
        </React.Fragment>
      );
    }
  },
);

const NotificationContainer = styled.View`
  display: ${(props) => props.theme.notification.display};
  flex-direction: ${(props) => props.theme.notification.flexDirection};
  align-items: ${(props) => props.theme.notification.alignItems};
  z-index: ${(props) => props.theme.notification.zIndex};
  margin-bottom: ${(props) => props.theme.notification.marginBottom};
  padding: ${(props) => props.theme.notification.padding}px;
  color: ${(props) =>
    props.type && props.theme.notification[props.type].color
      ? props.theme.notification[props.type].color
      : props.theme.notification.color};
  background-color: ${(props) =>
    props.type && props.theme.notification[props.type].backgroundColor
      ? props.theme.notification[props.type].backgroundColor
      : props.theme.notification.backgroundColor};
`;

const Notification = ({ children, active, type }) => {
  if (active) {
    return (
      <NotificationContainer type={type}>{children}</NotificationContainer>
    );
  }

  return null;
};

export { MessageList };
