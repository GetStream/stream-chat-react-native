import React, { PropsWithChildren, useContext } from 'react';

import type { SharedValue } from 'react-native-reanimated';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type BottomSheetContextValue = {
  close: (closeAnimationFinishedCallback?: () => void) => void;
  currentSnapIndex: SharedValue<number>;
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
