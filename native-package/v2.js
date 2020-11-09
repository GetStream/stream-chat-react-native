import React from 'react';
import { Platform } from 'react-native';
import { BlurView as RNBlurView } from '@react-native-community/blur';
import NetInfo from '@react-native-community/netinfo';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import ImagePicker from 'react-native-image-crop-picker';
import RNShare from 'react-native-share';
import { registerNativeHandlers } from 'stream-chat-react-native-core/src/v2';

registerNativeHandlers({
  // eslint-disable-next-line react/display-name
  BlurView: ({ blurAmount = 10, blurType = 'dark', style }) => (
    <RNBlurView blurAmount={blurAmount} blurType={blurType} style={style} />
  ),
  deleteFile: async ({ uri }) => {
    try {
      await RNFS.unlink(uri);
      return true;
    } catch (error) {
      console.log('File deletion failed...');
      return false;
    }
  },
  NetInfo: {
    addEventListener(listener) {
      let unsubscribe;
      // For NetInfo >= 3.x.x
      if (NetInfo.fetch && typeof NetInfo.fetch === 'function') {
        unsubscribe = NetInfo.addEventListener(({ isConnected }) => {
          listener(isConnected);
        });
        return unsubscribe;
      } else {
        // For NetInfo < 3.x.x
        unsubscribe = NetInfo.addEventListener('connectionChange', () => {
          NetInfo.isConnected.fetch().then((isConnected) => {
            listener(isConnected);
          });
        });

        return unsubscribe.remove;
      }
    },

    fetch() {
      return new Promise((resolve, reject) => {
        // For NetInfo >= 3.x.x
        if (NetInfo.fetch && typeof NetInfo.fetch === 'function') {
          NetInfo.fetch().then(({ isConnected }) => {
            resolve(isConnected);
          }, reject);
        } else {
          // For NetInfo < 3.x.x
          NetInfo.isConnected.fetch().then((isConnected) => {
            resolve(isConnected);
          }, reject);
        }
      });
    },
  },
  pickDocument: async ({ maxNumberOfFiles }) => {
    try {
      let res = await DocumentPicker.pickMultiple({
        type: [DocumentPicker.types.allFiles],
      });

      if (maxNumberOfFiles && res.length > maxNumberOfFiles) {
        res = res.slice(0, maxNumberOfFiles);
      }

      return {
        cancelled: false,
        docs: res.map(({ name, size, type, uri }) => ({
          name,
          size,
          type,
          uri,
        })),
      };
    } catch (err) {
      return {
        cancelled: true,
      };
    }
  },
  pickImage: async ({ compressImageQuality, maxNumberOfFiles }) => {
    try {
      let res = await ImagePicker.openPicker({
        compressImageQuality,
        forceJpg: true,
        includeBase64: Platform.OS === 'ios',
        maxFiles: maxNumberOfFiles || undefined,
        mediaType: 'photo',
        multiple: true,
        writeTempFile: false,
      });

      // maxFiles option on picker is only for iOS so this is a safety check for android
      if (maxNumberOfFiles && res.length > maxNumberOfFiles) {
        res = res.slice(0, maxNumberOfFiles);
      }

      return {
        cancelled: false,
        images: res.map((image) => ({
          uri:
            Platform.OS === 'ios'
              ? image.sourceURL || `data:${image.mime};base64,${image.data}`
              : image.path,
        })),
      };
    } catch (err) {
      return {
        cancelled: true,
      };
    }
  },
  saveFile: async ({ fileName, fromUrl }) => {
    try {
      const path = RNFS.DocumentDirectoryPath + '/' + fileName;
      await RNFS.downloadFile({ fromUrl, toFile: path });
      return path;
    } catch (error) {
      throw new Error('Downloading image failed...');
    }
  },
  shareImage: async ({ type, url }) => {
    try {
      await RNShare.open({ type, url });
      return true;
    } catch (error) {
      throw new Error('Sharing failed...');
    }
  },
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

export * from 'stream-chat-react-native-core/src/v2';
