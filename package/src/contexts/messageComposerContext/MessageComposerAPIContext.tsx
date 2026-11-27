import React, { useContext } from 'react';

import { LocalMessage, type MessageComposer, type ScheduledMessageResponse } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageComposerAPIContextValue = {
  setQuotedMessage: MessageComposer['setQuotedMessage'];
  setEditingState: (message?: LocalMessage) => void;
  clearEditingState: () => void;
  /**
   * Opens a scheduled message for editing in a composer of its own, so the channel's composer and
   * its draft are left as they are. The composer is put in use once it is filled in, which may wait
   * for the quoted message and the mentioned users. Saving or cancelling ends the edit.
   */
  editScheduledMessage: (scheduledMessage: ScheduledMessageResponse) => Promise<void>;
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
