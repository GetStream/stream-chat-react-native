import { Platform } from 'react-native';
import { registerNativeHandlers } from 'stream-chat-react-native-core';
import NetInfo from '@react-native-community/netinfo';
import ImagePicker from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';

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
  pickImage: () =>
    new Promise((resolve, reject) => {
      ImagePicker.showImagePicker({}, (response) => {
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
  pickDocument: async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      let { uri } = res;
      if (Platform.OS === 'android') {
        uri = 'file://' + res.path;
      }

      return {
        cancelled: false,
        uri,
        name: res.name,
      };
    } catch (err) {
      return {
        cancelled: true,
      };
    }
  },
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
