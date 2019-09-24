/**
 * In Expo 34, all the modules such as image picker, document picker, permissions etc etc have been moved to their own packages.
 * And they have been removed from Expo package. But these packages don't work with Expo 32 sdk (because of linking issue).
 */
import { registerNativeHandlers } from 'stream-chat-react-native-core';
import { NetInfo } from 'react-native';
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
      const unsubscribe = NetInfo.addEventListener('connectionChange', () => {
        NetInfo.isConnected.fetch().then((isConnected) => {
          listener(isConnected);
        });
      });
      return unsubscribe.remove;
    },
    fetch() {
      return new Promise((resolve, reject) => {
        NetInfo.isConnected.fetch().then((isConnected) => {
          resolve(isConnected);
        }, reject);
      });
    },
  },
  pickImage: async () => {
    await Permissions.askAsync(Permissions.CAMERA_ROLL);

    return await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      aspect: [4, 3],
      //TODO: Decide what to do about it
      quality: 0.2,
    });
  },
  pickDocument: async () => await DocumentPicker.getDocumentAsync(),
});

export * from 'stream-chat-react-native-core';
