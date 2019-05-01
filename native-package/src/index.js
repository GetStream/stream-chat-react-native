import { registerNativeHandlers } from 'stream-chat-react-native-core';
import NetInfo from '@react-native-community/netinfo';
// import { ImagePicker, Permissions } from 'expo';

registerNativeHandlers({
  NetInfo,
});

export * from 'stream-chat-react-native-core';
