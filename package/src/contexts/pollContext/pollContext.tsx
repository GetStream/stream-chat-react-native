import React, { PropsWithChildren, useContext } from 'react';

import { Poll } from 'stream-chat';

import { MessageType } from '../../components';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type PollContextValue = {
  message: MessageType;
  poll: Poll;
};

export const PollContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as PollContextValue);

export const PollContextProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: PollContextValue;
}>) => (
  <PollContext.Provider value={value as unknown as PollContextValue}>
    {children}
  </PollContext.Provider>
);

export const usePollContext = () => {
  const contextValue = useContext(PollContext) as unknown as PollContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useCreatePollContext hook was called outside of the PollContext provider. Make sure you have configured the Poll component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
