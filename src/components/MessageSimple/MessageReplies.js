import React from 'react';
import { Text, TouchableOpacity, Image } from 'react-native';

export const MessageReplies = ({ message, isThreadList, openThread, pos }) => {
  if (isThreadList || !Boolean(message.reply_count)) return null;

  return (
    <TouchableOpacity
      onPress={openThread}
      style={{ padding: 5, flexDirection: 'row' }}
    >
      {pos === 'left' ? (
        <Image source={require('../../images/icons/icon_path.png')} />
      ) : null}
      <Text style={{ color: '#006CFF' }}>
        {message.reply_count} {message.reply_count === 1 ? 'Reply' : 'Replies'}
      </Text>
      {pos === 'right' ? (
        <Image
          style={{
            transform: [{ rotateY: '180deg' }],
          }}
          source={require('../../images/icons/icon_path.png')}
        />
      ) : null}
    </TouchableOpacity>
  );
};
