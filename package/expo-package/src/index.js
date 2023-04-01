import { FlatList } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  compressImage,
  deleteFile,
  getLocalAssetUri,
  getPhotos,
  NetInfo,
  oniOS14GalleryLibrarySelectionChange,
  saveFile,
  Sound,
  takePhoto,
  Video,
} from './handlers';

import {
  pickDocument,
  setClipboardString,
  shareImage,
  triggerHaptic,
} from './optionalDependencies';

registerNativeHandlers({
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
