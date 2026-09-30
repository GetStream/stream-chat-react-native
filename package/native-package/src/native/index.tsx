import { NativeModules, processColor } from 'react-native';

import type { Options, ResizeFormat, Response } from './types';
export type { ResizeFormat, ResizeMode, Response } from './types';

// @ts-ignore
// eslint-disable-next-line no-underscore-dangle
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const ImageResizer = isTurboModuleEnabled
  ? require('./NativeStreamChatReactNative').default
  : NativeModules.StreamChatReactNative;

const defaultOptions: Options = {
  mode: 'contain',
  onlyScaleDown: false,
};

async function createResizedImage(
  uri: string,
  width: number,
  height: number,
  format: ResizeFormat,
  quality: number,
  rotation: number = 0,
  outputPath?: string | null,
  options: Options = defaultOptions,
): Promise<Response> {
  const { backgroundColor, mode, onlyScaleDown } = { ...defaultOptions, ...options };

  // The colour has to reach the native side as a plain ARGB integer, so anything
  // processColor cannot reduce to a number (PlatformColor, an unparseable string)
  // is rejected here rather than silently dropped.
  let processedBackgroundColor: number | null = null;
  if (backgroundColor !== undefined && backgroundColor !== null) {
    const processed = processColor(backgroundColor);
    if (typeof processed !== 'number') {
      throw new Error(
        `createResizedImage: unsupported backgroundColor \`${String(
          backgroundColor,
        )}\`. Pass a colour string such as '#FFFFFF' or an integer; PlatformColor and DynamicColorIOS are not supported.`,
      );
    }
    // Force the colour opaque. A background with any transparency is at best a silent no-op:
    // processColor('transparent') is 0, which passes the check above, and an encoder without an
    // alpha channel then drops it again and leaves exactly the platform-dependent result this
    // option exists to prevent. Partial alpha is worse, because it is resolved at a different
    // stage on each platform - '#FFFFFF00' comes out white on iOS and black on Android - so
    // there is no reason the two agree. Overriding the alpha byte makes the option always mean
    // what it says. `>>> 0` normalises to the unsigned form, which both native sides accept
    // (see the Double -> int conversion in StreamChatReactNativeModule.createResizedImage).
    processedBackgroundColor = (processed | 0xff000000) >>> 0;
  }

  return await ImageResizer.createResizedImage(
    uri,
    width,
    height,
    format,
    quality,
    mode,
    onlyScaleDown,
    rotation,
    outputPath,
    processedBackgroundColor,
  );
}

export default {
  createResizedImage,
};
