import React from 'react';
import { Platform } from 'react-native';
import { FlatList } from '@stream-io/flat-list-mvcp';

import { BlurView as RNBlurView } from '@react-native-community/blur';
import CameraRoll from '@react-native-community/cameraroll';
import NetInfo from '@react-native-community/netinfo';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
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
  FlatList,
  getPhotos: async ({ after, first }) => {
    try {
      const results = await CameraRoll.getPhotos({ after, first });
      const assets = results.edges.map((edge) => edge.node.image.uri);
      const hasNextPage = results.page_info.has_next_page;
      const endCursor = results.page_info.end_cursor;
      return { assets, endCursor, hasNextPage };
    } catch {
      throw new Error('getPhotos Error');
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
  saveFile: async ({ fileName, fromUrl }) => {
    try {
      const path = RNFS.DocumentDirectoryPath + '/' + fileName;
      await RNFS.downloadFile({ fromUrl, toFile: path }).promise;
      return 'file://' + path;
    } catch (error) {
      throw new Error('Downloading image failed...');
    }
  },
  shareImage: async ({ type, url }) => {
    try {
      const base64Image = await RNFS.readFile(url, 'base64');
      const base64Url = `data:${type};base64,${base64Image}`;
      await RNShare.open({
        activityItemSources:
          Platform.OS === 'ios'
            ? [
                {
                  item: {
                    default: {
                      content: url,
                      type: 'url',
                    },
                  },
                  linkMetadata: {
                    icon: url,
                  },
                  placeholderItem: {
                    content: url,
                    type: 'url',
                  },
                },
              ]
            : undefined,
        excludedActivityTypes: [],
        failOnCancel: false,
        type,
        url: Platform.OS === 'android' ? base64Url : undefined,
      });
      return true;
    } catch (error) {
      throw new Error('Sharing failed...');
    }
  },
  takePhoto: async () => {
    const photo = await ImagePicker.openCamera({});
    if (photo.height && photo.width && photo.path) {
      return {
        cancelled: false,
        height: photo.height,
        uri: photo.path,
        width: photo.width,
      };
    }
    return { cancelled: true };
  },
  triggerHaptic: (method) => {
    ReactNativeHapticFeedback.trigger(method, {
      enableVibrateFallback: false,
      ignoreAndroidSystemSettings: false,
    });
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
