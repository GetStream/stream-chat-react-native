import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  Audio,
  compressImage,
  deleteFile,
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
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
