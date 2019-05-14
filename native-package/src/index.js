import { Platform } from 'react-native';
import { registerNativeHandlers } from 'stream-chat-react-native-core';
import NetInfo from '@react-native-community/netinfo';
import ImagePicker from 'react-native-image-picker';
import {
  DocumentPicker,
  DocumentPickerUtil,
} from 'react-native-document-picker';

registerNativeHandlers({
  NetInfo,
  pickImage: () =>
    new Promise((resolve, reject) => {
      ImagePicker.showImagePicker(null, (response) => {
        if (response.error) {
          reject(Error(response.error));
        }
        let { uri } = response;
        if (Platform.OS === 'android') {
          uri = 'file://' + response.path;
        }

        resolve({
          cancelled: response.didCancel,
          uri,
        });
      });
    }),
  pickDocument: () =>
    new Promise((resolve, reject) => {
      DocumentPicker.show(
        { filetype: [DocumentPickerUtil.allFiles()] },
        (error, response) => {
          if (response.error) {
            reject(Error(response.error));
          }

          let { uri } = response;
          if (Platform.OS === 'android') {
            uri = 'file://' + response.path;
          }

          resolve({
            cancelled: response.didCancel,
            uri,
            name: response.fileName,
          });
        },
      );
    }),
});

if (Platform.OS === 'android') {
  if (typeof Symbol === 'undefined') {
    require('es6-symbol/implement');
    if (Array.prototype[Symbol.iterator] === undefined) {
      Array.prototype[Symbol.iterator] = function() {
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
