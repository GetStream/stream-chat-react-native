import React, { PropsWithChildren, useContext } from 'react';

import { ChannelState, LocalMessage, Thread } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ThreadType = { thread: LocalMessage; threadInstance: Thread };

export type ThreadContextValue = {
  allowThreadMessagesInChannel: boolean;
  closeThread: () => void;
  loadMoreThread: () => Promise<void>;
  openThread: (message: LocalMessage) => void;
  reloadThread: () => void;
  setThreadLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  thread: LocalMessage | null;
  threadHasMore: boolean;
  threadMessages: ChannelState['threads'][string];
  loadMoreRecentThread?: (opts: { limit?: number }) => Promise<void>;
  /**
   * Boolean to enable/disable parent message press
   */
  parentMessagePreventPress?: boolean;
  threadInstance?: Thread | null;
  threadLoadingMore?: boolean;
  threadLoadingMoreRecent?: boolean;
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
