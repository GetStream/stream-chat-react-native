import type { ColorValue } from 'react-native';

import StreamChatReactNative from '../native';

export type CompressImageParams = {
  /**
   * Painted behind the image, flattening any alpha channel onto this colour.
   *
   * This handler always encodes to JPEG, which has no alpha channel, so without a background
   * any transparent area of a PNG or WebP comes out **black**. Pass `'#FFFFFF'` to get the
   * white backdrop a browser canvas would give you instead.
   *
   * Only supported by `stream-chat-react-native` (React Native CLI). `stream-chat-expo` has no
   * equivalent.
   *
   * (Default: undefined - no background is painted)
   */
  backgroundColor?: ColorValue;
  compressImageQuality: number;
  height: number;
  uri: string;
  width: number;
};

export const compressImage = async ({
  backgroundColor,
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
      { backgroundColor, mode: 'cover' },
    );
    return compressedUri;
  } catch (error) {
    console.log('Error resizing image:', error);
    return uri;
  }
};
