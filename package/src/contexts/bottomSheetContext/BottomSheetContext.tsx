import React, { PropsWithChildren, useContext } from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type BottomSheetContextValue = {
  /**
   * Callback that will safely close the modal while preserving animation
   * timing and respecting actions finishing before the close is invoked.
   *
   * @param closeAnimationFinishedCallback {function} - a callback that is
   * going to be invoked when the closing animation finishes (but not necessarily
   * when the modal is actually dismissed)
   * @returns void
   */
  close: (closeAnimationFinishedCallback?: () => void) => void;
  /**
   * A callback that will safely dismiss the modal, while preserving animation timing
   * and respecting actions finishing before the close is invoked. Very similar to `close`,
   * however it takes an extra step to make sure that the modal is actually dismissed
   * before its callback is invoked. This is mostly useful for iOS, where for certain
   * libraries (i.e `react-native-image-picker`) you aren't able to open both a RN modal
   * and its internal `UIImagePickerController` at the same time and you have to wait
   * for `onDismiss` to be fired internally.
   *
   * It will work exactly the same as `close` for Android as this is not an issue there.
   *
   * @param closeAnimationFinishedCallback {function} - a callback that is
   * going to be invoked when the dismissal of the modal finishes
   * @returns void
   */
  dismiss: (dismissFinishedCallback?: () => void) => void;
  currentSnapIndex: SharedValue<number>;
  topSnapIndex: SharedValue<number>;
};

export const BottomSheetContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as BottomSheetContextValue,
);

export type BottomSheetProviderProps = PropsWithChildren<{
  value: BottomSheetContextValue;
}>;

export const BottomSheetProvider = ({ children, value }: BottomSheetProviderProps) => (
  <BottomSheetContext.Provider value={value as unknown as BottomSheetContextValue}>
    {children}
  </BottomSheetContext.Provider>
);

export const useBottomSheetContext = () => {
  const contextValue = useContext(BottomSheetContext);

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useBottomSheetContext hook was called outside the BottomSheetContext Provider. Make sure you have configured BottomSheetModal component correctly.',
    );
  }

  return contextValue;
};
