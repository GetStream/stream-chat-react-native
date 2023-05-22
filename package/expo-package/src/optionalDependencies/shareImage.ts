let Sharing;

try {
  Sharing = require('expo-sharing');
} catch (e) {
  // do nothing
}

if (!Sharing) {
  console.log(
    'expo-sharing is not installed. Installing this package will allow your users to share attachments from the gallery using the native sharing interface on their devices.',
  );
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
