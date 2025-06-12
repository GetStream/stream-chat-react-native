import { Platform } from 'react-native';

let RNShare;

try {
  RNShare = require('react-native-share').default;
} catch (e) {
  console.log('react-native-share is not installed');
}

export const shareImage = RNShare
  ? async ({ type, url }) => {
      try {
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
          url: Platform.OS === 'android' ? `file://${url}` : undefined,
        });
        return true;
      } catch (error) {
        console.warn('Sharing failed...', error);
      }
    }
  : null;
