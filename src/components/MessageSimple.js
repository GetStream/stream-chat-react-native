import React from 'react';
import { View, Text } from 'react-native';
import { styles, buildStylesheet } from '../styles/styles.js';
import { Attachment } from './Attachment';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';

export class MessageSimple extends React.PureComponent {
  isMessageBeforeSeparator = (message) => {
    return (
      message.groupPosition.indexOf('bottom') > -1 ||
      message.groupPosition.indexOf('single') > -1
    );
  };

  messageContentContainer = () => {
    const { message, isMyMessage, style } = this.props;
    const hasAttachment = Boolean(
      message && message.attachments && message.attachments.length,
    );
    return (
      <View style={{ display: 'flex', flexDirection: 'column', maxWidth: 250 }}>
        {hasAttachment
          ? message.attachments.map((attachment, index) => (
              <Attachment
                key={`${message.id}-${index}`}
                attachment={attachment}
              />
            ))
          : false}
        <MessageText message={message} isMyMessage={isMyMessage} />
      </View>
    );
  };

  messageAvatarContainer = () => {
    const { message } = this.props;
    const showAvatar =
      message.groupPosition[0] === 'single' ||
      message.groupPosition[0] === 'bottom'
        ? true
        : false;
    return (
      <View style={{}}>
        {showAvatar ? (
          <Avatar
            image={message.user.image}
            size={32}
            name={message.user.name}
          />
        ) : (
          <View style={{ width: 32, height: 32 }} />
        )}
      </View>
    );
  };

  render() {
    const { message, isMyMessage, style } = this.props;
    const hasAttachment = Boolean(
      message && message.attachments && message.attachments.length,
    );
    const styles = buildStylesheet('MessageSimple', style);
    const pos = isMyMessage(message) ? 'right' : 'left';
    return (
      <View
        style={{
          ...styles.container,
          ...styles[pos],
          marginBottom: this.isMessageBeforeSeparator(message) ? 20 : 0,
        }}
      >
        {isMyMessage(message) ? (
          <React.Fragment>
            {this.messageContentContainer()}
            {this.messageAvatarContainer()}
          </React.Fragment>
        ) : (
          <React.Fragment>
            {this.messageAvatarContainer()}
            {this.messageContentContainer()}
          </React.Fragment>
        )}
      </View>
    );
  }
}

class MessageText extends React.PureComponent {
  capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  render() {
    const { message, isMyMessage, style } = this.props;

    const pos = isMyMessage(message) ? 'right' : 'left';
    const groupStyles =
      (isMyMessage(message) ? 'right' : 'left') +
      this.capitalize(message.groupPosition[0]);

    if (!message.text) return false;
    const styles = buildStylesheet('MessageText', style);
    return (
      <View
        style={{
          ...styles.container,
          ...styles[pos],
          ...styles[groupStyles],
        }}
      >
        <Text style={styles.text}>{message.text}</Text>
      </View>
    );
  }
}
