import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import { BlurView as ExpoBlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Permissions from 'expo-permissions';
import { registerNativeHandlers } from 'stream-chat-react-native-core/src/v2';

registerNativeHandlers({
  // eslint-disable-next-line react/display-name
  BlurView: ({ blurAmount = 100, blurType = 'dark', style }) => (
    <ExpoBlurView intensity={blurAmount} style={style} tint={blurType} />
  ),
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

export * from 'stream-chat-react-native-core/src/v2';
