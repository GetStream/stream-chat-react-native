import { Platform } from 'react-native';

import { FlatList } from '@stream-io/flat-list-mvcp';
import { registerNativeHandlers } from 'stream-chat-react-native-core';

import {
  compressImage,
  deleteFile,
  NetInfo,
  getLocalAssetUri,
  getPhotos,
  pickDocument,
  saveFile,
  shareImage,
  Sound,
  takePhoto,
  triggerHaptic,
  Video,
} from './handlers';

registerNativeHandlers({
  compressImage,
  deleteFile,
  FlatList,
  getLocalAssetUri,
  getPhotos,
  NetInfo,
  pickDocument,
  saveFile,
  SDK: 'stream-chat-react-native',
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
