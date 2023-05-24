import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

let RNShare;

try {
  RNShare = require('react-native-share').default;
} catch (e) {
  console.log('react-native-share is not installed');
}

export const shareImage = RNShare
  ? async ({ type, url }) => {
      try {
        const base64Image = await RNFS.readFile(url, 'base64');
        const base64Url = `data:${type};base64,${base64Image}`;
        await RNShare.open({
          activityItemSources:
            Platform.OS === 'ios'
              ? [
                  {
                    item: {
                      default: {
                        content: url,
                        type: 'url',
                      },
                    },
                    linkMetadata: {
                      icon: url,
                    },
                    placeholderItem: {
                      content: url,
                      type: 'url',
                    },
                  },
                ]
              : undefined,
          // react-native-share has a typing issue, where their docs confirm that
          // this property should be an array of strings, but the type is a string
          // in the @types/react-native-share package.
          excludedActivityTypes: [] as unknown as string,
          failOnCancel: false,
          type,
          url: Platform.OS === 'android' ? base64Url : undefined,
        });
        return true;
      } catch (error) {
        console.warn('Sharing failed...');
      }
    }
  : null;
