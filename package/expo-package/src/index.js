import { FlatList } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  Audio,
  compressImage,
  deleteFile,
  NetInfo,
  saveFile,
  Sound,
  Video,
} from './handlers';

import {
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
  oniOS14GalleryLibrarySelectionChange,
  pickDocument,
  pickImage,
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
  pickImage,
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
