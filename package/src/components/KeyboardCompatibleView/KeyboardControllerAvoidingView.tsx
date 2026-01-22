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

type KeyboardControllerModule = typeof import('react-native-keyboard-controller');

const optionalRequire = <T,>(): T | undefined => {
  try {
    return require('react-native-keyboard-controller') as T;
  } catch {
    return undefined;
  }
};

export type KeyboardCompatibleViewProps = ReactNativeKeyboardAvoidingViewProps &
  ExtraKeyboardControllerProps;

const KeyboardControllerPackage = optionalRequire<KeyboardControllerModule>();

const { AndroidSoftInputModes, KeyboardController, KeyboardProvider, KeyboardAvoidingView } =
  KeyboardControllerPackage ?? {};

export const KeyboardCompatibleView = (props: KeyboardCompatibleViewProps) => {
  const { behavior = 'translate-with-padding', children, ...rest } = props;

  useEffect(() => {
    if (AndroidSoftInputModes) {
      KeyboardController?.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE);
    }

    return () => KeyboardController?.setDefaultMode();
  }, []);

  if (KeyboardProvider && KeyboardAvoidingView) {
    return (
      <KeyboardProvider>
        {/* @ts-expect-error - The reason is that react-native-keyboard-controller's KeyboardAvoidingViewProps is a discriminated union, not a simple behavior union so it complains about the `position` value passed. */}
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
  if (KeyboardControllerPackage?.KeyboardController) {
    KeyboardControllerPackage?.KeyboardController.dismiss();
  }
  Keyboard.dismiss();
};

export { KeyboardControllerPackage };
