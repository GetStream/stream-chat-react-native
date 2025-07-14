import React, { useContext, useMemo, useState } from 'react';

import { LocalMessage } from 'stream-chat';

import {
  MessageComposerAPIContextValue,
  MessageComposerAPIProvider,
} from './MessageComposerAPIContext';

import { ChannelProps } from '../../components';
import { useStableCallback } from '../../hooks';
import { useCreateMessageComposer } from '../messageInputContext/hooks/useCreateMessageComposer';
import { ThreadContextValue } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';
import { isTestEnvironment } from '../utils/isTestEnvironment';

export type MessageComposerContextValue = {
  channel: ChannelProps['channel'];
  thread: ThreadContextValue['thread'];
  threadInstance: ThreadContextValue['threadInstance'];
  /**
   * Variable that tracks the editing state.
   * It is defined with message type if the editing state is true, else its undefined.
   */
  editing?: LocalMessage;
};

export const MessageComposerContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as MessageComposerContextValue,
);

type Props = React.PropsWithChildren<{
  value: Pick<MessageComposerContextValue, 'channel' | 'threadInstance' | 'thread'>;
}>;

export const MessageComposerProvider = ({ children, value }: Props) => {
  const [editing, setEditing] = useState<LocalMessage | undefined>(undefined);

  const setEditingState: MessageComposerAPIContextValue['setEditingState'] = useStableCallback(
    (message) => {
      setEditing(message);
    },
  );

  const clearEditingState: MessageComposerAPIContextValue['clearEditingState'] = useStableCallback(
    () => setEditing(undefined),
  );

  const messageComposerContextValue = useMemo(() => ({ editing, ...value }), [editing, value]);

  const messageComposer = useCreateMessageComposer(messageComposerContextValue);

  const setQuotedMessage = useStableCallback((message: LocalMessage | null) =>
    messageComposer.setQuotedMessage(message),
  );

  const messageComposerAPIContextValue = useMemo(
    () => ({ clearEditingState, setEditingState, setQuotedMessage }),
    [clearEditingState, setEditingState, setQuotedMessage],
  );

  return (
    <MessageComposerContext.Provider value={messageComposerContextValue}>
      <MessageComposerAPIProvider value={messageComposerAPIContextValue}>
        {children}
      </MessageComposerAPIProvider>
    </MessageComposerContext.Provider>
  );
};

export const useMessageComposerContext = () => {
  const contextValue = useContext(MessageComposerContext) as unknown as MessageComposerContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useMessageComposerContext hook was called outside of the MessageComposerContext provider.',
    );
  }

  return contextValue;
};
