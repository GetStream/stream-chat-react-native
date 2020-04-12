import { Platform } from 'react-native';
import { registerNativeHandlers } from 'stream-chat-react-native-core';

registerNativeHandlers({
  NetInfo: {
    fetch: async () => {
      await undefined;
      return true;
    },
    addEventListener: () => {},
  },

  pickImage: null,
  pickDocument: null,
  ActionSheet: () => null,
  ImageViewer: () => null,
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
