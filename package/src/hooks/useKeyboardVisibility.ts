import { useEffect, useState } from 'react';
import { EventSubscription, Keyboard, Platform } from 'react-native';

import { KeyboardControllerPackage } from '../components/KeyboardCompatibleView/KeyboardControllerAvoidingView';

/**
 * A custom hook that provides a boolean value indicating whether the keyboard is visible.
 * @returns A boolean value indicating whether the keyboard is visible.
 */
export const useKeyboardVisibility = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const listeners: EventSubscription[] = [];
    if (KeyboardControllerPackage?.KeyboardEvents) {
      listeners.push(
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardWillShow', () =>
          setIsKeyboardVisible(true),
        ),
      );
      listeners.push(
        KeyboardControllerPackage.KeyboardEvents.addListener('keyboardWillHide', () =>
          setIsKeyboardVisible(false),
        ),
      );
    } else {
      listeners.push(
        Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
          setIsKeyboardVisible(true),
        ),
      );
      listeners.push(
        Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
          setIsKeyboardVisible(false),
        ),
      );
    }

    return () => listeners.forEach((listener) => listener.remove());
  }, []);

  return isKeyboardVisible;
};
