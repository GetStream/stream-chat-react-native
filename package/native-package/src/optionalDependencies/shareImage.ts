import { Platform } from 'react-native';

let RNShare;

try {
  RNShare = require('react-native-share').default;
} catch (e) {
  console.log('react-native-share is not installed');
}

let RNBlobUtil;

try {
  RNBlobUtil = require('react-native-blob-util').default;
} catch (e) {
  console.log('react-native-blob-util is not installed');
}

export const shareImage = RNShare
  ? async ({ type, url }) => {
      try {
        const base64Image = await RNBlobUtil.fs.readFile(url, 'base64');
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
          excludedActivityTypes: [] as unknown as string,
          failOnCancel: false,
          type,
          url: Platform.OS === 'android' ? base64Url : undefined,
        });
        return true;
      } catch (error) {
        console.warn('Sharing failed...', error);
      }
    }
  : null;
