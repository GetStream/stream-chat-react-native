import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type TypingContextValue = {
  typing: ChannelState['typing'];
};

export const TypingContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as TypingContextValue);

export const TypingProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: TypingContextValue;
}>) => (
  <TypingContext.Provider value={value as unknown as TypingContextValue}>
    {children}
  </TypingContext.Provider>
);

export const useTypingContext = () => {
  const contextValue = useContext(TypingContext) as unknown as TypingContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useTypingContext hook was called outside of the TypingContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
