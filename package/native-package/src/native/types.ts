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

/**
 * A colour `processColor` can reduce to a plain ARGB integer: a colour string
 * (`'#FFFFFF'`, `'white'`, `'rgba(255, 255, 255, 1)'`) or an RGBA integer — note the channel
 * order, `0xRRGGBBAA`, so opaque white is `0xFFFFFFFF`. `null` is treated the same as
 * omitting it: no background is painted.
 *
 * Narrower than react-native's `ColorValue`, which also admits
 * `PlatformColor`/`DynamicColorIOS`. Those cannot cross the bridge as a plain integer and are
 * rejected at runtime — and `compressImage` swallows that rejection and silently returns the
 * uncompressed image, so this type is the only guardrail a caller actually gets.
 */
export type BackgroundColor = string | number | null;

export type Options = {
  /**
   * Painted behind the image, flattening any alpha channel onto this colour.
   *
   * When converting to a format without alpha channel without a background any transparent area of a PNG or WebP depends on platform behavior. Pass a color value to explicitly control background color.
   *
   * Only supported by `stream-chat-react-native` (React Native CLI). `stream-chat-expo` has no
   * equivalent.
   *
   * (Default: undefined - no background is painted)
   */
  backgroundColor?: BackgroundColor;
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
