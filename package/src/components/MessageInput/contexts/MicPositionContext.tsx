import React, { createContext, PropsWithChildren, useContext } from 'react';

import { SharedValue } from 'react-native-reanimated';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../../../contexts/utils/defaultBaseContextValue';
import { isTestEnvironment } from '../../../contexts/utils/isTestEnvironment';

export type MicPositionContextValue = {
  micPositionX: SharedValue<number>;
  micPositionY: SharedValue<number>;
};

const MicPositionContext = createContext(
  DEFAULT_BASE_CONTEXT_VALUE as unknown as MicPositionContextValue,
);

export const MicPositionProvider = ({
  children,
  value,
}: PropsWithChildren<{ value: MicPositionContextValue }>) => (
  <MicPositionContext.Provider value={value}>{children}</MicPositionContext.Provider>
);

export const useMicPositionContext = () => {
  const contextValue = useContext(MicPositionContext) as unknown as MicPositionContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMicPositionContext hook was called outside of the MicPositionProvider. Make sure MessageInput wraps the subtree where mic positions are used.',
    );
  }

  return contextValue;
};
