/**
 * In Expo 34, all the modules such as image picker, document picker, permissions etc etc have been moved to their own packages.
 * And they have been removed from Expo package. But these packages don't work with Expo 32 sdk (because of linking issue).
 */
import { registerNativeHandlers } from 'stream-chat-react-native-core';
import NetInfo from '@react-native-community/netinfo';
import { Constants } from 'react-native-unimodules';
import * as Expo from 'expo';

let ImagePicker;
let DocumentPicker;
let Permissions;
let manifest = {};

manifest = Constants.manifest;
if (!manifest) {
  manifest = Expo.Constants.manifest;
}

if (manifest.sdkVersion.split('.')[0] >= 33) {
  ImagePicker = require('expo-image-picker');
  Permissions = require('expo-permissions');
  DocumentPicker = require('expo-document-picker');
} else {
  ImagePicker = Expo.ImagePicker;
  Permissions = Expo.Permissions;
  DocumentPicker = Expo.DocumentPicker;
}

registerNativeHandlers({
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
  pickImage: async ({ compressImageQuality = 0.2, maxNumberOfFiles }) => {
    try {
      const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
      if (status !== 'granted') {
        return {
          cancelled: true,
        };
      }

      const { cancelled, ...rest } = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        aspect: [4, 3],
        quality: compressImageQuality,
      });

      if (cancelled) {
        return {
          cancelled,
        };
      }
      return {
        cancelled: false,
        images: [{ uri: rest.uri }],
      };
    } catch (err) {
      return {
        cancelled: true,
      };
    }
  },
});

export * from 'stream-chat-react-native-core';
