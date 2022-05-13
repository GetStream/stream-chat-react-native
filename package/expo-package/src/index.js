import React from 'react';
import { FlatList, Image, Platform } from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import { Video as ExpoVideoPlayer } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { registerNativeHandlers } from 'stream-chat-react-native-core';

registerNativeHandlers({
  compressImage: async ({ compressImageQuality = 1, uri }) => {
    const { uri: compressedUri } = await ImageManipulator.manipulateAsync(uri, [], {
      compress: Math.min(Math.max(0, compressImageQuality), 1),
    });
    return compressedUri;
  },
  deleteFile: async ({ uri }) => {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      console.log('File deletion failed...');
      return false;
    }
  },
  FlatList,
  getLocalAssetUri: async (assetId) => {
    try {
      const { localUri } = await MediaLibrary.getAssetInfoAsync(assetId);
      return localUri;
    } catch {
      throw new Error('getLocalAssetUri Error');
    }
  },
  getPhotos: async ({ after, first }) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('getPhotos Error');
      }
      const results = await MediaLibrary.getAssetsAsync({
        after,
        first,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
      });
      const assets = results.assets.map((asset) => ({
        duration: asset.duration,
        filename: asset.filename,
        height: asset.height,
        id: asset.id,
        source: 'picker',
        type: asset.mediaType,
        uri: asset.uri,
        width: asset.width,
      }));

      const hasNextPage = results.hasNextPage;
      const endCursor = results.endCursor;
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
      const { type, ...rest } = await DocumentPicker.getDocumentAsync();

      if (type === 'cancel') {
        return {
          cancelled: true,
        };
      }
      return {
        cancelled: false,
        docs: [rest],
      };
    } catch (err) {
      return {
        cancelled: true,
      };
    }
  },
  saveFile: async ({ fileName, fromUrl }) => {
    try {
      const path = FileSystem.cacheDirectory + encodeURIComponent(fileName);
      const downloadedImage = await FileSystem.downloadAsync(fromUrl, path);
      return downloadedImage.uri;
    } catch (error) {
      throw new Error('Downloading image failed...');
    }
  },
  SDK: 'stream-chat-expo',
  shareImage: async ({ type, url }) => {
    try {
      await Sharing.shareAsync(url, { mimeType: type, UTI: type });
      return true;
    } catch (error) {
      throw new Error('Sharing failed or cancelled...');
    }
  },
  takePhoto: async ({ compressImageQuality = 1 }) => {
    try {
      const permissionCheck = await ImagePicker.getCameraPermissionsAsync();
      const permissionGranted =
        permissionCheck?.status === 'granted'
          ? permissionCheck
          : await ImagePicker.requestCameraPermissionsAsync();

      if (permissionGranted?.status === 'granted' || permissionGranted?.granted === true) {
        const photo = await ImagePicker.launchCameraAsync({
          quality: Math.min(Math.max(0, compressImageQuality), 1),
        });
        if (photo.height && photo.width && photo.uri) {
          let size = {};
          if (Platform.OS === 'android') {
            // Height and width returned by ImagePicker are incorrect on Android.
            // The issue is described in following github issue:
            // https://github.com/ivpusic/react-native-image-crop-picker/issues/901
            // This we can't rely on them as it is, and we need to use Image.getSize
            // to get accurate size.
            const getSize = () =>
              new Promise((resolve) => {
                Image.getSize(photo.uri, (width, height) => {
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
            uri: photo.uri,
            ...size,
          };
        }
      }
    } catch (error) {
      console.log(error);
    }
    return { cancelled: true };
  },
  triggerHaptic: (method) => {
    switch (method) {
      case 'impactHeavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'impactLight':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'impactMedium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'notificationError':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'notificationSuccess':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'notificationWarning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      default:
        Haptics.selectionAsync();
    }
  },
  // eslint-disable-next-line react/display-name
  Video: ({ onPlaybackStatusUpdate, paused, resizeMode, style, uri, videoRef }) => (
    <ExpoVideoPlayer
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      ref={videoRef}
      resizeMode={resizeMode}
      shouldPlay={!paused}
      source={{
        uri,
      }}
      style={[style]}
    />
  ),
});

export * from 'stream-chat-react-native-core';
