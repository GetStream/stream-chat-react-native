import { FlatList } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  Audio,
  compressImage,
  deleteFile,
  getLocalAssetUri,
  getPhotos,
  NetInfo,
  oniOS14GalleryLibrarySelectionChange,
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
  oniOS14GalleryLibrarySelectionChange,
  pickDocument,
  saveFile,
  SDK: 'stream-chat-expo',
  setClipboardString,
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
});

export * from 'stream-chat-react-native-core';
