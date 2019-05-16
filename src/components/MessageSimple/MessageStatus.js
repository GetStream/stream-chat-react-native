import React from 'react';
import { View, Image } from 'react-native';

import loadingGif from '../../images/loading.gif';
import iconDeliveredUnseen from '../../images/icons/delivered_unseen.png';

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
        <Image source={loadingGif} style={{ height: 10, width: 10 }} />
      </View>
    );
  } else if (
    message.status === 'received' &&
    message.type !== 'ephemeral' &&
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
        <Image source={iconDeliveredUnseen} />
      </View>
    );
  } else {
    return <View style={{ height: 10, width: 20 }} />;
  }
};
