/**
 * In Expo 34, all the modules such as image picker, document picker, permissions etc etc have been moved to their own packages.
 * And they have been removed from Expo package. But these packages don't work with Expo 32 sdk (because of linking issue).
 */
import { registerNativeHandlers, Storage } from 'stream-chat-react-native-core';
import { NetInfo, AsyncStorage } from 'react-native';
import { Constants } from 'react-native-unimodules';
import * as Expo from 'expo';
import Reactotron, { asyncStorage, overlay } from 'reactotron-react-native';

Reactotron.setAsyncStorageHandler(AsyncStorage) // AsyncStorage would either come from `react-native` or `@react-native-community/async-storage` depending on where you get it from
  .configure({
    name: 'React Native Demo',
  })
  .useReactNative({
    asyncStorage: true, // there are more options to the async storage.
    networking: {
      // optionally, you can turn it off with false.
      ignoreUrls: /symbolicate/,
    },
    editor: false, // there are more options to editor
    errors: { veto: () => false }, // or turn it off with false
    overlay: false, // just turning off overlay
  })
  .use(asyncStorage())
  .use(overlay())
  .connect();

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
  // ExpoSqlite = require('expo-sqlite');
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
  AsyncStorage,
  storage: new Storage(
    AsyncStorage.setItem.bind(AsyncStorage),
    AsyncStorage.getItem.bind(AsyncStorage),
    AsyncStorage.multiSet.bind(AsyncStorage),
    AsyncStorage.multiGet.bind(AsyncStorage),
  ),
});

export * from 'stream-chat-react-native-core';
