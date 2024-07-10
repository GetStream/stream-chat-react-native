import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  compressImage,
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
  oniOS14GalleryLibrarySelectionChange,
} from './handlers';

import {
  Audio,
  deleteFile,
  pickDocument,
  saveFile,
  setClipboardString,
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
} from './optionalDependencies';

registerNativeHandlers({
  Audio,
  compressImage,
  deleteFile,
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
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
