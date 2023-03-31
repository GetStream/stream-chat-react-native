let Sharing;

try {
  Sharing = require('expo-sharing').default;
} catch (error) {
  console.log('expo-sharing is not installed');
}

export const shareImage = Sharing
  ? async ({ type, url }: { type: string; url: string }) => {
      try {
        await Sharing.shareAsync(url, { mimeType: type, UTI: type });
        return true;
      } catch (error) {
        console.warn('Sharing failed or cancelled...');
      }
    }
  : null;
