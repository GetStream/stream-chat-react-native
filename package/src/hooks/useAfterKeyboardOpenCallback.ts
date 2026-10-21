import { useEffect, useRef } from 'react';
import { EventSubscription, Keyboard, Platform } from 'react-native';

import { useStableCallback } from './useStableCallback';

import { useMessageInputContext } from '../contexts/messageInputContext/MessageInputContext';

/**
 * Returns a stable callback that focuses the message input and runs `callback` once the keyboard is
 * open.
 *
 * @param callback Runs once the keyboard is open.
 * @returns A stable callback that waits for the keyboard before running `callback`.
 */
export const useAfterKeyboardOpenCallback = <T extends unknown[]>(
  callback: (...args: T) => void,
) => {
  const { inputBoxRef } = useMessageInputContext();
  const keyboardSubscriptionRef = useRef<EventSubscription | undefined>(undefined);
  // Runs from a keyboard event listener, so it must read the latest callback across re-renders.
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

    if (Keyboard.isVisible()) {
      inputBoxRef.current.focus();
      runCallback();
      return;
    }

    const keyboardEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';

    keyboardSubscriptionRef.current = Keyboard.addListener(keyboardEvent, runCallback);

    inputBoxRef.current.focus();
  });
};
