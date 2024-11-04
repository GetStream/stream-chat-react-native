import StreamChatReactNative from '../native';

type CompressImageParams = {
  compressImageQuality: number;
  height: number;
  uri: string;
  width: number;
};

export const compressImage = async ({
  compressImageQuality = 1,
  height,
  uri,
  width,
}: CompressImageParams) => {
  try {
    const { uri: compressedUri } = await StreamChatReactNative.createResizedImage(
      uri,
      width,
      height,
      'JPEG',
      Math.min(Math.max(0, compressImageQuality), 1) * 100,
      0,
      undefined,
      false,
      { mode: 'cover' },
    );
    return compressedUri;
  } catch (error) {
    console.log('Error resizing image:', error);
    return uri;
  }
};
