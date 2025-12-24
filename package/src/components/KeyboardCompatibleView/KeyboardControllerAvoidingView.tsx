import React from 'react';

import {
  Keyboard,
  Platform,
  KeyboardAvoidingViewProps as ReactNativeKeyboardAvoidingViewProps,
} from 'react-native';

import {
  KeyboardAvoidingView as KeyboardControllerPackageKeyboardAvoidingView,
  KeyboardController as KeyboardControllerPackageKeyboardController,
  KeyboardEvents,
  KeyboardProvider,
} from 'react-native-keyboard-controller';

import { KeyboardCompatibleView as KeyboardCompatibleViewDefault } from './KeyboardCompatibleView';

type ExtraKeyboardControllerProps = {
  behavior?: 'translate-with-padding';
};

export type KeyboardCompatibleViewProps = ReactNativeKeyboardAvoidingViewProps &
  ExtraKeyboardControllerProps;

let KeyboardControllerPackage:
  | {
      KeyboardAvoidingView: typeof KeyboardControllerPackageKeyboardAvoidingView;
      KeyboardController: typeof KeyboardControllerPackageKeyboardController;
      KeyboardProvider: typeof KeyboardProvider;
      KeyboardEvents: typeof KeyboardEvents;
    }
  | undefined;

try {
  KeyboardControllerPackage = require('react-native-keyboard-controller');
} catch (e) {
  KeyboardControllerPackage = undefined;
}

export const KeyboardCompatibleView = (props: KeyboardCompatibleViewProps) => {
  const { behavior = 'translate-with-padding', children, ...rest } = props;

  const KeyboardProvider = KeyboardControllerPackage?.KeyboardProvider;
  const KeyboardAvoidingView = KeyboardControllerPackage?.KeyboardAvoidingView;

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
