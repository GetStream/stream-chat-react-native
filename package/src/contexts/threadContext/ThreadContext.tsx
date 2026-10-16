import React, { PropsWithChildren, useContext } from 'react';

import { Thread } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type AlsoSentToChannelHeaderPressPayload = {
  targetedMessageId: string;
  thread?: Thread;
};

export type ThreadContextValue = {
  allowThreadMessagesInChannel: boolean;
  thread?: Thread | null;
  /**
   * Function to handle press on the "Also sent to channel" header action.
   * @param payload - Navigation payload with the targeted message id and, from a channel list, its thread
   * @returns void
   */
  onAlsoSentToChannelHeaderPress?: (payload: AlsoSentToChannelHeaderPressPayload) => void;
};

export const ThreadContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as ThreadContextValue);

export const ThreadProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadContextValue;
}>) => (
  <ThreadContext.Provider value={value as unknown as ThreadContextValue}>
    {children}
  </ThreadContext.Provider>
);

export const useThreadContext = () => {
  const contextValue = useContext(ThreadContext) as unknown as ThreadContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useThreadContext hook was called outside of the ThreadContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
