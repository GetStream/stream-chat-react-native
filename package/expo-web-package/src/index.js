import React from 'react';

import * as Sharing from 'expo-sharing';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

registerNativeHandlers({
  SDK: 'stream-chat-expo-web',
  shareImage: async ({ type, url }) => {
    try {
      await Sharing.shareAsync(url, { mimeType: type, UTI: type });
      return true;
    } catch (error) {
      throw new Error('Sharing failed or cancelled...');
    }
  },
});

export * from 'stream-chat-react-native-core';
