import React from 'react';
import { Text, TouchableOpacity, Image } from 'react-native';

import iconPath from '../../images/icons/icon_path.png';

export const MessageReplies = ({ message, isThreadList, openThread, pos }) => {
  if (isThreadList || !message.reply_count) return null;

  return (
    <TouchableOpacity
      onPress={openThread}
      style={{ padding: 5, flexDirection: 'row' }}
    >
      {pos === 'left' ? <Image source={iconPath} /> : null}
      <Text style={{ color: '#006CFF' }}>
        {message.reply_count} {message.reply_count === 1 ? 'Reply' : 'Replies'}
      </Text>
      {pos === 'right' ? (
        <Image
          style={{
            transform: [{ rotateY: '180deg' }],
          }}
          source={iconPath}
        />
      ) : null}
    </TouchableOpacity>
  );
};
