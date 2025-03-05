import React, { PropsWithChildren, useContext } from 'react';

import { FlatListProps } from 'react-native';

import { Channel, Thread } from 'stream-chat';

import { ThreadType } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ThreadsContextValue = {
  isFocused: boolean;
  isLoading: boolean;
  isLoadingNext: boolean;
  threads: Thread[];
  additionalFlatListProps?: Partial<FlatListProps<Thread>>;
  loadMore?: () => Promise<void>;
  onThreadSelect?: (thread: ThreadType, channel: Channel) => void;
  ThreadListEmptyPlaceholder?: React.ComponentType;
  ThreadListItem?: React.ComponentType;
  ThreadListLoadingIndicator?: React.ComponentType;
  ThreadListLoadingMoreIndicator?: React.ComponentType;
  ThreadListUnreadBanner?: React.ComponentType;
};

export const ThreadsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ThreadsContextValue,
);

export const ThreadsProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadsContextValue;
}>) => (
  <ThreadsContext.Provider value={value as unknown as ThreadsContextValue}>
    {children}
  </ThreadsContext.Provider>
);

export const useThreadsContext = () => {
  const contextValue = useContext(ThreadsContext) as unknown as ThreadsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useThreadsContext hook was called outside of the ThreadsContext provider. Make sure you have configured the ThreadList component correctly - https://getstream.io/chat/docs/sdk/react-native/ui-components/thread-list/',
    );
  }

  return contextValue;
};
