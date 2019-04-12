import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles.js';
import { Attachment } from './Attachment';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';

export const MessageSimple = ({ message, isMyMessage }) => {
  const hasAttachment = Boolean(message && message.attachments && message.attachments.length);

  const messageContentContainer = (
    <View style={{ display: 'flex', flexDirection: 'column', maxWidth: 250 }}>
      {hasAttachment ? message.attachments.map((attachment, index) => (
        <Attachment key={`${message.id}-${index}`} attachment={attachment} />
      )) : false}
      <MessageText message={message} isMyMessage />
    </View>
  );

  const messageAvatarContainer = (
      <View style={{ marginBottom: -15 }}>
        <Avatar
          image={message.user.image}
          size={50}
          name={message.user.name}
          style={{ opacity: isMessageBeforeSeparator(message) ? 100 : 0 }}
        />
      </View>
    );

    return (
    <View
      style={{
        ...styles.Message.container,
        justifyContent: isMyMessage(message) ? 'flex-end' : 'flex-start',
        marginBottom: isMessageBeforeSeparator(message) ? 20 : 0,
      }}
    >
      {isMyMessage(message) ? (
        <React.Fragment>
          {messageContentContainer}
          {messageAvatarContainer}
        </React.Fragment>
      ) : (
        <React.Fragment>
          {messageAvatarContainer}
          {messageContentContainer}
        </React.Fragment>
      )}
    </View>
  );
};

const isMessageBeforeSeparator = (message) => {
  return (
    message.groupPosition.indexOf('bottom') > -1 ||
    message.groupPosition.indexOf('single') > -1
  );
};


const capitalize = (s) => {
  if (typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const MessageText = ({ message, isMyMessage = false }) => {
  if (!message.text) return false;

  return (
    <View
      style={{
        ...styles.MessageText.container,
        ...styles.MessageText[
          (isMyMessage ? 'my' : 'other') +
            'Message' +
            capitalize(message.groupPosition[0])
        ],
        backgroundColor: isMyMessage ? '#EBEBEB' : 'white',
      }}
    >
      <Text style={{ flex: 1 }}>{message.text}</Text>
    </View>
  );
};
