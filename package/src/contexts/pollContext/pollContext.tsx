import React, { PropsWithChildren, useContext } from 'react';

import { Poll, PollOptionData } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type PollContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  maxNumberOfVotes: number;
  name: string;
  options: PollOptionData<StreamChatGenerics>[];
  optionVoteCounts: Record<string, number>;
  poll: Poll<StreamChatGenerics>;
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
      `The useCreatePollContext hook was called outside of the PollContext provider. Make sure you have configured the Poll component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};
