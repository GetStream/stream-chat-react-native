import React from 'react';
import { FlatList, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { BlurView as ExpoBlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as Permissions from 'expo-permissions';
import * as Sharing from 'expo-sharing';
import { registerNativeHandlers } from 'stream-chat-react-native-core';

registerNativeHandlers({
  // eslint-disable-next-line react/display-name
  BlurView: ({ blurAmount = 100, blurType = 'dark', style }) => (
    <ExpoBlurView intensity={blurAmount} style={style} tint={blurType} />
  ),
  compressImage: async ({ compressImageQuality = 1, uri }) => {
    const { uri: compressedUri } = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: Math.min(Math.max(0, compressImageQuality), 1) },
    );
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
  getPhotos: async ({ after, first }) => {
    try {
      if (Platform.OS === 'android') {
        const { status } = await Permissions.askAsync(
          Permissions.MEDIA_LIBRARY,
        );
        if (status !== 'granted') {
          throw new Error('getPhotos Error');
        }
      }
      const results = await MediaLibrary.getAssetsAsync({
        after,
        first,
        mediaType: [MediaLibrary.MediaType.photo],
      });
      const assets = results.assets.map((asset) => ({
        height: asset.height,
        source: 'picker',
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
      const path = FileSystem.documentDirectory + fileName;
      const downloadedImage = await FileSystem.downloadAsync(fromUrl, path);
      return downloadedImage.uri;
    } catch (error) {
      throw new Error('Downloading image failed...');
    }
  },
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
      const { status } = ImagePicker.getCameraPermissionsAsync();
      if (status === 'granted') {
        const photo = await ImagePicker.launchCameraAsync({
          quality: Math.min(Math.max(0, compressImageQuality), 1),
        });
        if (photo.height && photo.width && photo.uri) {
          return {
            cancelled: false,
            height: photo.height,
            source: 'camera',
            uri: photo.uri,
            width: photo.width,
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
});

export * from 'stream-chat-react-native-core';
