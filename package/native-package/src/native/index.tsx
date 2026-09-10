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
    processedBackgroundColor = processed;
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
