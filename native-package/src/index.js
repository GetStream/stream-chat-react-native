import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import DocumentPicker from 'react-native-document-picker';
import ImagePicker from 'react-native-image-crop-picker';
import { registerNativeHandlers } from 'stream-chat-react-native-core';

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
  pickDocument: async () => {
    try {
      const res = await DocumentPicker.pickMultiple({
        type: [DocumentPicker.types.allFiles],
      });

      return {
        cancelled: false,
        docs: res.map(({ name, uri }) => ({ name, uri })),
      };
    } catch (err) {
      return {
        cancelled: true,
      };
    }
  },
  pickImage: async () => {
    try {
      const res = await ImagePicker.openPicker({
        includeBase64: Platform.OS === 'ios',
        multiple: true,
        writeTempFile: false,
      });

      return {
        cancelled: false,
        images: res.map((image) => ({
          uri:
            Platform.OS === 'ios'
              ? `data:${image.mime};base64,${image.data}`
              : image.path,
        })),
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
