import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * A custom hook that provides a boolean value indicating whether the keyboard is visible.
 * @returns A boolean value indicating whether the keyboard is visible.
 */
export const useKeyboardVisibility = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const listeners = [
      Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () =>
        setIsKeyboardVisible(true),
      ),
      Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
        setIsKeyboardVisible(false),
      ),
    ];

    return () => listeners.forEach((listener) => listener.remove());
  }, []);

  return isKeyboardVisible;
};
