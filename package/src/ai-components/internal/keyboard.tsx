import React, { type ComponentType } from 'react';
import { Keyboard, View } from 'react-native';

import type { KeyboardStickyViewProps } from 'react-native-keyboard-controller';

type KeyboardControllerPackage = typeof import('react-native-keyboard-controller');

let keyboardController: KeyboardControllerPackage | undefined;

try {
  keyboardController = require('react-native-keyboard-controller');
} catch (_) {
  // do nothing
}

const PlainView = ({ enabled: _enabled, offset: _offset, ...props }: KeyboardStickyViewProps) => (
  <View {...props} />
);

export const KeyboardStickyView: ComponentType<KeyboardStickyViewProps> =
  keyboardController?.KeyboardStickyView ?? PlainView;

export const useKeyboardHandler: KeyboardControllerPackage['useKeyboardHandler'] =
  keyboardController?.useKeyboardHandler ?? (() => undefined);

export const dismissKeyboard = (): Promise<void> => {
  if (keyboardController) {
    return keyboardController.KeyboardController.dismiss();
  }
  Keyboard.dismiss();
  return Promise.resolve();
};

export const keyboardHeight = () => keyboardController?.KeyboardController.state()?.height ?? 0;
