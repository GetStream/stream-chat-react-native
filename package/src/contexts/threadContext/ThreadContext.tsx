import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type { StreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type ThreadContextValue<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = {
  allowThreadMessagesInChannel: boolean;
  closeThread: () => void;
  loadMoreThread: () => Promise<void>;
  openThread: (message: MessageType<At, Ch, Co, Ev, Me, Re, Us>) => void;
  reloadThread: () => void;
  setThreadLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  thread: MessageType<At, Ch, Co, Ev, Me, Re, Us> | null;
  threadHasMore: boolean;
  threadLoadingMore: boolean;
  threadMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['threads'][string];
};

export const ThreadContext = React.createContext({} as ThreadContextValue);

export const ThreadProvider = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ThreadContext.Provider value={value as unknown as ThreadContextValue}>
    {children}
  </ThreadContext.Provider>
);

export const useThreadContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>() => useContext(ThreadContext) as unknown as ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>;

/**
 * Typescript currently does not support partial inference so if ThreadContext
 * typing is desired while using the HOC withThreadContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withThreadContext = <P extends UnknownType, StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithThreadContextComponent = (
    props: Omit<P, keyof ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const threadContext = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...threadContext} />;
  };
  WithThreadContextComponent.displayName = `WithThreadContext${getDisplayName(Component)}`;
  return WithThreadContextComponent;
};
