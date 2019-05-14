import React from 'react';
import { View } from 'react-native';
import { buildStylesheet } from '../../styles/styles.js';
import { Avatar } from '../Avatar';

export const MessageAvatar = ({ message, isMyMessage, style }) => {
  const pos = isMyMessage(message) ? 'right' : 'left';
  const styles = buildStylesheet('MessageSimpleAvatar', style);

  const showAvatar =
    message.groupPosition[0] === 'single' ||
    message.groupPosition[0] === 'bottom'
      ? true
      : false;

  return (
    <View
      style={{
        ...styles[pos],
      }}
    >
      {showAvatar ? (
        <Avatar image={message.user.image} size={32} name={message.user.name} />
      ) : (
        <View style={{ width: 32, height: 28 }} />
      )}
    </View>
  );
};
