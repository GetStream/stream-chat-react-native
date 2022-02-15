import React from 'react';
import { Image, PermissionsAndroid, Platform } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

registerNativeHandlers({
  SDK: 'stream-chat-react-native-web',
  shareImage: async ({ text, title, url }) => {
    if (navigator.share) {
      await navigator.share({ text, title, url });
    } else {
      throw new Error('navigator', 'share');
    }
  },
});

export * from 'stream-chat-react-native-core';
