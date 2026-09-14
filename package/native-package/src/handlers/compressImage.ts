import StreamChatReactNative from '../native';
import type { BackgroundColor } from '../native/types';

/**
 * Painted behind every image this handler compresses unless the caller says otherwise.
 *
 * White rather than nothing: the encoder is always JPEG, so the alpha channel cannot survive
 * either way, and leaving the choice to the platform produces black on Android and white on
 * iOS for the same input.
 */
export const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';

export type CompressImageParams = {
  /**
   * Painted behind the image, flattening any alpha channel onto this colour.
   *
   * This handler always encodes to JPEG, which has no alpha channel, so a transparent area of a
   * PNG or WebP has to become *some* colour. Left to the platform that colour is black on
   * Android and white on iOS; defaulting to white here makes the two agree and matches what a
   * transparent image is nearly always designed to sit on.
   *
   * Always painted fully opaque; any alpha in the colour is ignored. Pass `null` to opt out and
   * get the platform's own behaviour back.
   *
   * Only supported by `stream-chat-react-native` (React Native CLI). `stream-chat-expo` has no
   * equivalent, so an Expo app keeps the platform default.
   *
   * (Default: '#FFFFFF')
   */
  backgroundColor?: BackgroundColor;
  compressImageQuality: number;
  height: number;
  uri: string;
  width: number;
};

export const compressImage = async ({
  // Only substituted for `undefined`, so an explicit `null` still means "paint nothing".
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
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
