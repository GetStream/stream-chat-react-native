import { Platform } from 'react-native';

import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
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
  Audio,
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
  SDK: 'stream-chat-react-native',
  setClipboardString,
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
});

if (Platform.OS === 'android') {
  if (typeof Symbol === 'undefined') {
    // eslint-disable-next-line no-undef
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
