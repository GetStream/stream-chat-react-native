import React, { useEffect } from 'react';

import {
  Keyboard,
  Platform,
  KeyboardAvoidingViewProps as ReactNativeKeyboardAvoidingViewProps,
} from 'react-native';

import { KeyboardCompatibleView as KeyboardCompatibleViewDefault } from './KeyboardCompatibleView';

type ExtraKeyboardControllerProps = {
  behavior?: 'translate-with-padding';
};

export type KeyboardCompatibleViewProps = ReactNativeKeyboardAvoidingViewProps &
  ExtraKeyboardControllerProps;

// @ts-ignore
let KeyboardControllerPackage;

try {
  KeyboardControllerPackage = require('react-native-keyboard-controller');
} catch (e) {
  KeyboardControllerPackage = undefined;
}

const { AndroidSoftInputModes, KeyboardController, KeyboardProvider, KeyboardAvoidingView } =
  KeyboardControllerPackage ?? {};

export const KeyboardCompatibleView = (props: KeyboardCompatibleViewProps) => {
  const { behavior = 'translate-with-padding', children, ...rest } = props;

  useEffect(() => {
    KeyboardController?.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE);

    return () => KeyboardController?.setDefaultMode();
  }, []);

  if (KeyboardProvider && KeyboardAvoidingView) {
    return (
      <KeyboardProvider>
        <KeyboardAvoidingView behavior={behavior} {...rest}>
          {children}
        </KeyboardAvoidingView>
      </KeyboardProvider>
    );
  }
  const compatibleBehavior =
    behavior === 'translate-with-padding'
      ? Platform.OS === 'ios'
        ? 'padding'
        : 'position'
      : behavior;

  return (
    <KeyboardCompatibleViewDefault behavior={compatibleBehavior} {...rest}>
      {children}
    </KeyboardCompatibleViewDefault>
  );
};

export const dismissKeyboard = () => {
  // @ts-ignore
  if (KeyboardControllerPackage?.KeyboardController) {
    KeyboardControllerPackage?.KeyboardController.dismiss();
  }
  Keyboard.dismiss();
};

export { KeyboardControllerPackage };
