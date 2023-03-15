import { FlatList } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  Audio,
  compressImage,
  deleteFile,
  getLocalAssetUri,
  getPhotos,
  NetInfo,
  pickDocument,
  saveFile,
  setClipboardString,
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
} from './handlers';

registerNativeHandlers({
  Audio,
  compressImage,
  deleteFile,
  FlatList,
  getLocalAssetUri,
  getPhotos,
  NetInfo,
  pickDocument,
  saveFile,
  setClipboardString,
  SDK: 'stream-chat-expo',
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
});

export * from 'stream-chat-react-native-core';
