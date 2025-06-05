import React, { useContext, useMemo } from 'react';

import { LocalMessage, type MessageComposer } from 'stream-chat';

import { useStableCallback } from '../../hooks';
import { useMessageComposer } from '../messageInputContext/hooks/useMessageComposer';
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
  value: Pick<MessageComposerAPIContextValue, 'setEditingState' | 'clearEditingState'>;
}>;

export const MessageComposerAPIProvider = ({ children, value }: Props) => {
  const messageComposer = useMessageComposer();

  const setQuotedMessage = useStableCallback((message: LocalMessage | null) =>
    messageComposer.setQuotedMessage(message),
  );

  const contextValue = useMemo(() => ({ setQuotedMessage, ...value }), [setQuotedMessage, value]);

  return (
    <MessageComposerAPIContext.Provider value={contextValue}>
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
