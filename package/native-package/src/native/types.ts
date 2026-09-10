import type { ColorValue } from 'react-native';

export interface Response {
  height: number;
  name: string;
  path: string;
  size: number;
  uri: string;
  width: number;
}

export interface VideoThumbnailResponse extends Response {}

export type ResizeFormat = 'PNG' | 'JPEG' | 'WEBP';
export type ResizeMode = 'contain' | 'cover' | 'stretch';

export type Options = {
  /**
   * Painted behind the image before it is encoded, flattening any alpha channel
   * onto this colour.
   *
   * Without it, converting an image that has transparency to a format that has
   * no alpha channel (`'JPEG'`) turns the transparent areas **black**, because
   * the encoder drops the alpha and keeps the underlying RGB. Pass
   * `backgroundColor: '#FFFFFF'` to get the white backdrop a browser canvas
   * would give you instead.
   *
   * Applied whenever it is set, for every output format — asking for `'PNG'`
   * output with a `backgroundColor` produces an opaque PNG. When omitted, the
   * image is encoded exactly as before.
   *
   * Accepts any colour string or integer that
   * [processColor](https://reactnative.dev/docs/colors) understands, e.g.
   * `'#FFFFFF'` or `'white'`. `PlatformColor`/`DynamicColorIOS` values are not
   * supported, because the colour has to cross the bridge as a plain integer.
   *
   * (Default: undefined — no background is painted)
   */
  backgroundColor?: ColorValue;
  /**
   * Either `contain` (the default), `cover`, or `stretch`. Similar to
   * [react-native <Image>'s resizeMode](https://reactnative.dev/docs/image#resizemode)
   *
   * - `contain` will fit the image within `width` and `height`,
   *   preserving its ratio
   * - `cover` will make sure at least one dimension fits `width` or
   *   `height`, and the other is larger, also preserving its ratio.
   * - `stretch` will resize the image to exactly `width` and `height`.
   *
   * (Default: 'contain')
   */
  mode?: ResizeMode;
  /**
   * Whether to avoid resizing the image to be larger than the original.
   * (Default: false)
   */
  onlyScaleDown?: boolean;
};
