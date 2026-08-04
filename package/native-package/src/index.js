import { Platform } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import { compressImage, multipartUpload } from './handlers';

import {
  Audio,
  deleteFile,
  FlatList,
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
  SDK: 'stream-chat-react-native',
});

if (Platform.OS === 'android') {
  if (typeof Symbol === 'undefined') {
    require('es6-symbol/implement');
    if (Array.prototype[Symbol.iterator] === undefined) {
      Array.prototype[Symbol.iterator] = function () {
        let i = 0;
        return {
          next: () => ({
            done: i >= this.length,
            value: this[i++],
          }),
        };
      };
    }
  }
}

export * from 'stream-chat-react-native-core';
