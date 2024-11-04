import { NativeModules } from 'react-native';

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
  keepMeta = false,
  options: Options = defaultOptions,
): Promise<Response> {
  const { mode, onlyScaleDown } = { ...defaultOptions, ...options };

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
    keepMeta,
  );
}

export default {
  createResizedImage,
};
