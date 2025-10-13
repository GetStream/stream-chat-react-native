import { NativeModules } from 'react-native';

import type {
  ImpactFeedbackType,
  NotificationFeedbackType,
  Options,
  ResizeFormat,
  Response,
} from './types';
export type { ResizeFormat, ResizeMode, Response } from './types';
import NativeStreamChatHapticsModule from './NativeStreamChatHapticsModule';
import NativeStreamChatReactNative from './NativeStreamChatReactNative';
import NativeStreamChatImageCompress from './NativeStreamChatImageCompress';
import { CompressImageOptions } from './types/compressImage';

// @ts-ignore
// eslint-disable-next-line no-underscore-dangle
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const ImageResizer = isTurboModuleEnabled
  ? NativeStreamChatReactNative
  : NativeModules.StreamChatReactNative;

const Haptics = isTurboModuleEnabled
  ? NativeStreamChatHapticsModule
  : NativeModules.StreamChatHapticsModule;

const ImageCompress = isTurboModuleEnabled
  ? NativeStreamChatImageCompress
  : NativeModules.StreamChatImageCompress;

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

export async function notificationFeedback(type: NotificationFeedbackType) {
  await Haptics.notificationFeedback(type);
}

export async function impactFeedback(type: ImpactFeedbackType) {
  await Haptics.impactFeedback(type);
}

export async function selectionFeedback() {
  await Haptics.selectionFeedback();
}

export async function compressImage(imageURL: string, options: CompressImageOptions) {
  return await ImageCompress.compressImage(imageURL, options);
}

export default {
  createResizedImage,
};
