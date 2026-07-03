import { FlatList } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import { compressImage, multipartUpload } from './handlers';

import {
  Audio,
  deleteFile,
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
  NativeShimmerView,
  oniOS14GalleryLibrarySelectionChange,
  overrideAudioRecordingConfiguration,
  pickDocument,
  pickImage,
  saveFile,
  setClipboardString,
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
} from './optionalDependencies';

/**
 * The default native handlers this package registers with the core SDK.
 */
export const defaultNativeHandlers = {
  Audio,
  compressImage,
  deleteFile,
  FlatList,
  getLocalAssetUri,
  getPhotos,
  iOS14RefreshGallerySelection,
  multipartUpload,
  NativeShimmerView,
  oniOS14GalleryLibrarySelectionChange,
  overrideAudioRecordingConfiguration,
  pickDocument,
  pickImage,
  saveFile,
  setClipboardString,
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
};

registerNativeHandlers({
  ...defaultNativeHandlers,
  SDK: 'stream-chat-expo',
});

export * from 'stream-chat-react-native-core';
