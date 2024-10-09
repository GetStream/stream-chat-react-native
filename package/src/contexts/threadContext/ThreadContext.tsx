import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ThreadContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  allowThreadMessagesInChannel: boolean;
  closeThread: () => void;
  loadMoreThread: () => Promise<void>;
  openThread: (message: MessageType<StreamChatGenerics>) => void;
  reloadThread: () => void;
  setThreadLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  thread: MessageType<StreamChatGenerics> | null;
  threadHasMore: boolean;
  threadLoadingMore: boolean;
  threadMessages: ChannelState<StreamChatGenerics>['threads'][string];
  /**
   * Boolean to enable/disable parent message press
   */
  parentMessagePreventPress?: boolean;
};

export const ThreadContext = React.createContext(DEFAULT_BASE_CONTEXT_VALUE as ThreadContextValue);

export const ThreadProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadContextValue<StreamChatGenerics>;
}>) => (
  <ThreadContext.Provider value={value as unknown as ThreadContextValue}>
    {children}
  </ThreadContext.Provider>
);

export const useThreadContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>() => {
  const contextValue = useContext(
    ThreadContext,
  ) as unknown as ThreadContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The useThreadContext hook was called outside of the ThreadContext provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
  }

  return contextValue;
};
