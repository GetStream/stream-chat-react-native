import React, { useContext } from 'react';

import { LocalMessage, type MessageComposer } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageComposerAPIContextValue = {
  setQuotedMessage: MessageComposer['setQuotedMessage'];
  setEditingState: (message?: LocalMessage) => void;
  clearEditingState: () => void;
};

export const MessageComposerAPIContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageComposerAPIContextValue,
);

type Props = React.PropsWithChildren<{
  value: MessageComposerAPIContextValue;
}>;

export const MessageComposerAPIProvider = ({ children, value }: Props) => {
  return (
    <MessageComposerAPIContext.Provider value={value}>
      {children}
    </MessageComposerAPIContext.Provider>
  );
};

export const useMessageComposerAPIContext = () => {
  const contextValue = useContext(
    MessageComposerAPIContext,
  ) as unknown as MessageComposerAPIContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessageComposerAPIContext hook was called outside of the MessageComposerAPIContext provider.',
    );
  }

  return contextValue;
};
