import * as Sharing from 'expo-sharing';

export const shareImage = async ({ type, url }: { type: string; url: string }) => {
  try {
    await Sharing.shareAsync(url, { mimeType: type, UTI: type });
    return true;
  } catch (error) {
    throw new Error('Sharing failed or cancelled...');
  }
};
