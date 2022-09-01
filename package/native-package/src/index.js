import React from 'react';
import { Image, PermissionsAndroid, Platform } from 'react-native';

import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ImagePicker from 'react-native-image-crop-picker';
import ImageResizer from 'react-native-image-resizer';
import RNShare from 'react-native-share';

import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import NetInfo from '@react-native-community/netinfo';
import { FlatList } from '@stream-io/flat-list-mvcp';
import { registerNativeHandlers } from 'stream-chat-react-native-core';

import AudioVideoPlayer from './optionalDependencies/Video';

registerNativeHandlers({
  compressImage: async ({ compressImageQuality = 1, height, uri, width }) => {
    try {
      const { uri: compressedUri } = await ImageResizer.createResizedImage(
        uri,
        height,
        width,
        'JPEG',
        Math.min(Math.max(0, compressImageQuality), 1) * 100,
        0,
        undefined,
        false,
        'cover',
      );
      return compressedUri;
    } catch (error) {
      console.log(error);
      return uri;
    }
  },
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
  getLocalAssetUri: async (remoteUri) => {
    try {
      const localUri = await CameraRoll.save(remoteUri);
      return localUri;
    } catch {
      throw new Error('getLocalAssetUri Error');
    }
  },
  getPhotos: async ({ after, first }) => {
    try {
      if (Platform.OS === 'android') {
        const readExternalStoragePermissionAndroid =
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        const hasPermission = await PermissionsAndroid.check(readExternalStoragePermissionAndroid);
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(readExternalStoragePermissionAndroid, {
            buttonNegative: 'Deny',
            buttonNeutral: 'Ask Me Later',
            buttonPositive: 'Allow',
            message: 'Permissions are required to access and share photos.',
            title: 'Photos Access',
          });
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            throw new Error('getPhotos Error');
          }
        }
      }
      const results = await CameraRoll.getPhotos({
        after,
        assetType: 'All',
        first,
        include: ['fileSize', 'filename', 'imageSize', 'playableDuration'],
      });
      const assets = results.edges.map((edge) => ({
        ...edge.node.image,
        source: 'picker',
      }));
      const hasNextPage = results.page_info.has_next_page;
      const endCursor = results.page_info.end_cursor;
      return { assets, endCursor, hasNextPage };
    } catch (_error) {
      throw new Error('getPhotos Error');
    }
  },
  NetInfo: {
    addEventListener(listener) {
      let unsubscribe;
      // For NetInfo >= 3.x.x
      if (NetInfo.fetch && typeof NetInfo.fetch === 'function') {
        unsubscribe = NetInfo.addEventListener(({ isConnected, isInternetReachable }) => {
          // Initialize with truthy value when internetReachable is still loading
          // if it resolves to false, listener is triggered with false value and network
          // status is updated
          listener(isInternetReachable === null ? isConnected : isConnected && isInternetReachable);
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
      const path = RNFS.CachesDirectoryPath + '/' + encodeURIComponent(fileName);
      await RNFS.downloadFile({ fromUrl, toFile: path }).promise;
      return 'file://' + path;
    } catch (error) {
      throw new Error('Downloading image failed...');
    }
  },
  SDK: 'stream-chat-react-native',
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
  Sound: {
    initializeSound: null,
    // eslint-disable-next-line react/display-name
    Player: AudioVideoPlayer
      ? ({ onBuffer, onEnd, onLoad, onProgress, paused, soundRef, style, uri }) => (
          <AudioVideoPlayer
            audioOnly={true}
            onBuffer={onBuffer}
            onEnd={onEnd}
            onError={(error) => {
              console.log(error);
            }}
            onLoad={onLoad}
            onProgress={onProgress}
            paused={paused}
            ref={soundRef}
            source={{
              uri,
            }}
            style={style}
          />
        )
      : null,
  },
  takePhoto: async ({ compressImageQuality = Platform.OS === 'ios' ? 0.8 : 1 }) => {
    const photo = await ImagePicker.openCamera({
      compressImageQuality: Math.min(Math.max(0, compressImageQuality), 1),
    });

    if (photo.height && photo.width && photo.path) {
      let size = {};
      if (Platform.OS === 'android') {
        // Height and width returned by ImagePicker are incorrect on Android.
        // The issue is described in following github issue:
        // https://github.com/ivpusic/react-native-image-crop-picker/issues/901
        // This we can't rely on them as it is, and we need to use Image.getSize
        // to get accurate size.
        const getSize = () =>
          new Promise((resolve) => {
            Image.getSize(photo.path, (width, height) => {
              resolve({ height, width });
            });
          });

        try {
          const { height, width } = await getSize();
          size.height = height;
          size.width = width;
        } catch (e) {
          // do nothing
          console.warning('Error get image size of picture caputred from camera ', e);
        }
      } else {
        size = {
          height: photo.height,
          width: photo.width,
        };
      }

      return {
        cancelled: false,
        source: 'camera',
        uri: photo.path,
        ...size,
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
  // eslint-disable-next-line react/display-name
  Video: AudioVideoPlayer
    ? ({ onBuffer, onEnd, onLoad, onProgress, paused, repeat, style, uri, videoRef }) => (
        <AudioVideoPlayer
          ignoreSilentSwitch={'ignore'}
          onBuffer={onBuffer}
          onEnd={onEnd}
          onError={(error) => {
            console.error(error);
          }}
          onLoad={onLoad}
          onProgress={onProgress}
          paused={paused}
          ref={videoRef}
          repeat={repeat}
          source={{
            uri,
          }}
          style={style}
        />
      )
    : null,
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
