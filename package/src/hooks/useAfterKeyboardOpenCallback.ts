import { useEffect, useRef } from 'react';
import { EventSubscription, Keyboard, Platform } from 'react-native';

import { useKeyboardVisibility } from './useKeyboardVisibility';

import { useStableCallback } from './useStableCallback';

import { KeyboardControllerPackage } from '../components/KeyboardCompatibleView/KeyboardControllerAvoidingView';
import { useMessageInputContext } from '../contexts/messageInputContext/MessageInputContext';

/**
 * A utility hook that returns a stable callback which focuses the message input
 * and invokes the callback once the keyboard is open.
 *
 * @param callback - callback we want to run once the keyboard is ready
 * @returns A stable callback that will wait for the keyboard to be open before executing.
 */
export const useAfterKeyboardOpenCallback = <T extends unknown[]>(
  callback: (...args: T) => void,
) => {
  const isKeyboardVisible = useKeyboardVisibility();
  const { inputBoxRef } = useMessageInputContext();
  const keyboardSubscriptionRef = useRef<EventSubscription | undefined>(undefined);
  const stableCallback = useStableCallback(callback);

  /** Clears the pending keyboard listener, if any. */
  const clearKeyboardSubscription = useStableCallback(() => {
    keyboardSubscriptionRef.current?.remove();
    keyboardSubscriptionRef.current = undefined;
  });

  useEffect(() => clearKeyboardSubscription, [clearKeyboardSubscription]);

  return useStableCallback((...args: T) => {
    clearKeyboardSubscription();

    const runCallback = () => {
      clearKeyboardSubscription();
      stableCallback(...args);
    };

    if (!inputBoxRef.current) {
      runCallback();
      return;
    }

    if (isKeyboardVisible) {
      inputBoxRef.current.focus();
      runCallback();
      return;
    }

    const keyboardEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';

    keyboardSubscriptionRef.current = KeyboardControllerPackage?.KeyboardEvents
      ? KeyboardControllerPackage.KeyboardEvents.addListener(keyboardEvent, runCallback)
      : Keyboard.addListener(keyboardEvent, runCallback);

    inputBoxRef.current.focus();
  });
};
