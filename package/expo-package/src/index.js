import { FlatList } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  Audio,
  compressImage,
  deleteFile,
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
  NetInfo,
  oniOS14GalleryLibrarySelectionChange,
  saveFile,
  Sound,
  Video,
} from './handlers';

import {
  pickDocument,
  setClipboardString,
  shareImage,
  takePhoto,
  triggerHaptic,
} from './optionalDependencies';

registerNativeHandlers({
  Audio,
  compressImage,
  deleteFile,
  FlatList,
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
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
