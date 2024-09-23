import React, { PropsWithChildren, useContext } from 'react';

import { FlatListProps } from 'react-native';

import { Channel, Thread } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { ThreadType } from '../threadContext/ThreadContext';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ThreadsContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  isFocused: boolean;
  isLoading: boolean;
  isLoadingNext: boolean;
  threads: Thread<StreamChatGenerics>[];
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

export const ThreadsProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadsContextValue<StreamChatGenerics>;
}>) => (
  <ThreadsContext.Provider value={value as unknown as ThreadsContextValue}>
    {children}
  </ThreadsContext.Provider>
);

export const useThreadsContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    ThreadsContext,
  ) as unknown as ThreadsContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      // TODO: Set correct link to docs page, should be the new ThreadList instead of Channel
      `The useThreadsContext hook was called outside of the ThreadsContext provider. Make sure you have configured the ThreadList component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};
