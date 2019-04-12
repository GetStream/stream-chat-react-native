import React, { PureComponent } from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import PropTypes from 'prop-types';
import { withChannelContext } from '../context';
import Moment from 'moment';
import { styles } from '../styles.js';

import { Message } from './Message';
import { MessageSimple } from './MessageSimple';

class MessageList extends PureComponent {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    /** A list of immutable messages */
    messages: PropTypes.array.isRequired,
    /** Turn off grouping of messages by user */
    noGroupByUser: PropTypes.bool,
  };

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

      if (i === messages.length - 1) {
        newMessages.push(message, {
          type: 'message.date',
          date: message.created_at,
        });
      } else if (messageDate !== prevMessageDate) {
        newMessages.push(message, {
          type: 'message.date',
          date: message.created_at,
        });
      } else {
        newMessages.push(message);
      }
    }

    return newMessages;
  };

  getMessageGroupPositions = (m) => {
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

  renderItem = ({ item: message }) => {
    if (message.type === 'message.date') {
      return <DateSeparator message={message} />;
    }

    return <Message message={message} Message={MessageSimple} />;
  };

  render() {
    const messagesWithDates = this.insertDates(this.props.messages);
    const messagesWithGroupPositions = this.getMessageGroupPositions(
      messagesWithDates,
    );

    return (
      <FlatList
        style={{ flex: 1, flexGrow: 1 }}
        data={messagesWithGroupPositions}
        inverted
        keyExtractor={(item, index) =>
          item.id || item.created_at || item.date.toISOString()
        }
        renderItem={this.renderItem}
      />
    );
  }
}

const DateSeparator = ({ message, formatDate, date }) => {
  return (
    <Text style={styles.DateSeparator.container}>
      {formatDate
        ? formatDate(date)
        : Moment(message.date.toISOString()).calendar(null, {
            lastDay: '[Yesterday]',
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            lastWeek: '[Last] dddd',
            nextWeek: 'dddd',
            sameElse: 'L',
          })}
    </Text>
  );
};

MessageList = withChannelContext(MessageList);
export { MessageList };
