import React from 'react';
import { View, Image } from 'react-native';

export const MessageStatus = ({ message, lastReceivedId, threadList }) => {
  if (message.status === 'sending') {
    return (
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 5,
          paddingRight: 5,
        }}
      >
        <Image
          source={require('../../images/loading.gif')}
          style={{ height: 10, width: 10 }}
        />
      </View>
    );
  } else if (
    message.status === 'received' &&
    message.id === lastReceivedId &&
    !threadList
  ) {
    return (
      <View
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 2,
        }}
      >
        <Image source={require('../../images/icons/delivered_unseen.png')} />
      </View>
    );
  } else {
    return <View style={{ height: 10, width: 20 }} />;
  }
};
