import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
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

  return contextValue as ThreadContextValue<StreamChatGenerics>;
};
/**
 * Typescript currently does not support partial inference so if ThreadContext
 * typing is desired while using the HOC withThreadContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withThreadContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ThreadContextValue<StreamChatGenerics>>> => {
  const WithThreadContextComponent = (
    props: Omit<P, keyof ThreadContextValue<StreamChatGenerics>>,
  ) => {
    const threadContext = useThreadContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...threadContext} />;
  };
  WithThreadContextComponent.displayName = `WithThreadContext${getDisplayName(Component)}`;
  return WithThreadContextComponent;
};
