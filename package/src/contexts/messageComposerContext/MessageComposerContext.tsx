import React, { useContext } from 'react';

import { LocalMessage } from 'stream-chat';

import { ChannelProps } from '../../components';
import { ThreadContextValue } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageComposerContextValue = {
  channel: ChannelProps['channel'];
  thread: ThreadContextValue['thread'];
  threadInstance: ThreadContextValue['threadInstance'];
  editing?: LocalMessage;
};

export const MessageComposerContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageComposerContextValue,
);

type Props = React.PropsWithChildren<{
  value: MessageComposerContextValue;
}>;

export const MessageComposerProvider = ({ children, value }: Props) => (
  <MessageComposerContext.Provider value={value}>{children}</MessageComposerContext.Provider>
);

export const useMessageComposerContext = () => {
  const contextValue = useContext(MessageComposerContext) as unknown as MessageComposerContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessageComposerContext hook was called outside of the MessageComposerContext provider.',
    );
  }

  return contextValue;
};
