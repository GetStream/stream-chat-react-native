import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

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

export const ThreadContext = React.createContext<ThreadContextValue | undefined>(undefined);

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
>(
  componentName?: string,
) => {
  const contextValue = useContext(
    ThreadContext,
  ) as unknown as ThreadContextValue<StreamChatGenerics>;

  if (!contextValue) {
    console.warn(
      `The useThreadContext hook was called outside of the ThreadContext provider. Make sure this hook is called within a child of the ThreadProvider component within Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as ThreadContextValue<StreamChatGenerics>;
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
