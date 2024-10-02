import React, { PropsWithChildren, useContext } from 'react';

import { CreatePollData } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type CreatePollContentContextValue = {
  closePollCreationDialog: () => void;
  createAndSendPoll: (pollData: CreatePollData) => Promise<void>;
};

export const CreatePollContentContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as CreatePollContentContextValue,
);

export const CreatePollContentProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: CreatePollContentContextValue;
}>) => (
  <CreatePollContentContext.Provider value={value as unknown as CreatePollContentContextValue}>
    {children}
  </CreatePollContentContext.Provider>
);

export const useCreatePollContentContext = () => {
  const contextValue = useContext(
    CreatePollContentContext,
  ) as unknown as CreatePollContentContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      // TODO: Set correct link to docs page, should be the new ThreadList instead of Channel
      `The useThreadsContext hook was called outside of the ThreadsContext provider. Make sure you have configured the ThreadList component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};
