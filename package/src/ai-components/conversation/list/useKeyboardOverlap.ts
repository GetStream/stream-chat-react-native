import { useRef } from 'react';
import { KeyboardController, useKeyboardHandler } from 'react-native-keyboard-controller';
import { runOnJS, type SharedValue, useSharedValue } from 'react-native-reanimated';

export type KeyboardFrame = { height: number; progress: number };

/**
 * How far the keyboard reaches over a view that ends `offset` above the bottom of the screen, as
 * `KeyboardAwareLegendList` reckons it: the keyboard's height less the offset, scaled by how far
 * the keyboard is open. In a worklet or on the JS thread.
 */
export const keyboardOverlapOf = (keyboard: KeyboardFrame, offset: number) => {
  'worklet';
  return Math.max(0, keyboard.height - offset * keyboard.progress);
};

/**
 * The keyboard's height and how far it is open, as it moves. `onSettled` runs on the JS thread
 * once it has finished moving.
 */
export const useKeyboardFrame = (onSettled?: () => void): SharedValue<KeyboardFrame> => {
  const initial = KeyboardController.state()?.height ?? 0;
  const keyboard = useSharedValue<KeyboardFrame>({
    height: initial,
    progress: initial > 0 ? 1 : 0,
  });
  const settled = useRef(onSettled);
  settled.current = onSettled;
  const reportSettled = () => settled.current?.();

  useKeyboardHandler(
    {
      onEnd: (event) => {
        'worklet';
        keyboard.value = { height: event.height, progress: event.progress };
        runOnJS(reportSettled)();
      },
      onInteractive: (event) => {
        'worklet';
        keyboard.value = { height: event.height, progress: event.progress };
      },
      onMove: (event) => {
        'worklet';
        keyboard.value = { height: event.height, progress: event.progress };
      },
    },
    [],
  );

  return keyboard;
};
