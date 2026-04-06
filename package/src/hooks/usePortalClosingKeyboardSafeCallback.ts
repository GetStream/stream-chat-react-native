import { useEffect, useRef } from 'react';
import { EventSubscription, Keyboard, Platform } from 'react-native';

import { useKeyboardVisibility } from './useKeyboardVisibility';

import { useStableCallback } from './useStableCallback';

import { KeyboardControllerPackage } from '../components/KeyboardCompatibleView/KeyboardControllerAvoidingView';
import { useMessageInputContext } from '../contexts/messageInputContext/MessageInputContext';

const SETTLE_FRAMES = Platform.OS === 'android' ? 2 : 0;

const scheduleAfterFrames = (callback: () => void, frames: number, rafIds: number[]) => {
  if (frames <= 0) {
    callback();
    return;
  }

  const rafId = requestAnimationFrame(() => scheduleAfterFrames(callback, frames - 1, rafIds));
  rafIds.push(rafId);
};

export const usePortalClosingKeyboardSafeCallback = <T extends unknown[]>(
  callback: (...args: T) => void,
) => {
  const isKeyboardVisible = useKeyboardVisibility();
  const { inputBoxRef } = useMessageInputContext();
  const keyboardSubscriptionRef = useRef<EventSubscription | undefined>(undefined);
  const rafIdsRef = useRef<number[]>([]);
  const stableCallback = useStableCallback(callback);

  const clearKeyboardSubscription = useStableCallback(() => {
    keyboardSubscriptionRef.current?.remove();
    keyboardSubscriptionRef.current = undefined;
  });

  const clearScheduledFrames = useStableCallback(() => {
    rafIdsRef.current.forEach((rafId) => cancelAnimationFrame(rafId));
    rafIdsRef.current = [];
  });

  useEffect(() => {
    return () => {
      clearKeyboardSubscription();
      clearScheduledFrames();
    };
  }, [clearKeyboardSubscription, clearScheduledFrames]);

  return useStableCallback((...args: T) => {
    clearKeyboardSubscription();
    clearScheduledFrames();

    scheduleAfterFrames(
      () => {
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
      },
      SETTLE_FRAMES,
      rafIdsRef.current,
    );
  });
};
