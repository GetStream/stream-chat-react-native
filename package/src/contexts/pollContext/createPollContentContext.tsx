import React, { PropsWithChildren, useContext } from 'react';

import { StateStore } from '@stream-io/state-store';

import { MessageInputContextValue } from '../messageInputContext/MessageInputContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type CreatePollModalState = {
  isClosing: boolean;
};

export type CreatePollContentContextValue = {
  createAndSendPoll: () => Promise<void>;
  sendMessage: MessageInputContextValue['sendMessage'];
  closePollCreationDialog?: () => void;
  modalStateStore?: StateStore<CreatePollModalState>;
  /** Vertical gap between poll options in the poll creation screen. Defaults to 8. */
  createPollOptionGap?: number;
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
      'The useCreatePollContentContext hook was called outside of the CreatePollContentContext provider. Make sure you have configured the CreatePoll component correctly - https://getstream.io/chat/docs/sdk/react-native/ui-components/create-poll/',
    );
  }

  return contextValue;
};
