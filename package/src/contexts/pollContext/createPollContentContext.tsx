import React, { PropsWithChildren, useContext } from 'react';

import { MessageInputContextValue } from '../messageInputContext/MessageInputContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type CreatePollContentContextValue = {
  createAndSendPoll: () => Promise<void>;
  sendMessage: MessageInputContextValue['sendMessage'];
  /**
   * A property that defines the constant height of the options within the poll creation screen.
   *
   * **Default: ** 71
   */
  closePollCreationDialog?: () => void;
  createPollOptionHeight?: number;
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
      'The useCreatePollContentContext hook was called outside of the CreatePollContentContext provider. Make sure you have configured the CreatePollContent component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
