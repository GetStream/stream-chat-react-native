import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { ChannelState } from 'stream-chat';

import type { MessageType } from '../../components/MessageList/hooks/useMessageList';
import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ThreadContextValue<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  allowThreadMessagesInChannel: boolean;
  closeThread: () => void;
  loadMoreThread: () => Promise<void>;
  openThread: (message: MessageType<At, Ch, Co, Ev, Me, Re, Us>) => void;
  setThreadLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  thread: MessageType<At, Ch, Co, Ev, Me, Re, Us> | null;
  threadHasMore: boolean;
  threadLoadingMore: boolean;
  threadMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['threads'][string];
};

export const ThreadContext = React.createContext({} as ThreadContextValue);

export const ThreadProvider = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>({
  children,
  value,
}: PropsWithChildren<{
  value: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <ThreadContext.Provider value={(value as unknown) as ThreadContextValue}>
    {children}
  </ThreadContext.Provider>
);

export const useThreadContext = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>() =>
  (useContext(ThreadContext) as unknown) as ThreadContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if ThreadContext
 * typing is desired while using the HOC withThreadContextContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withThreadContext = <
  P extends UnknownType,
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithThreadContextComponent = (
    props: Omit<P, keyof ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const threadContext = useThreadContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...threadContext} />;
  };
  WithThreadContextComponent.displayName = `WithThreadContext${getDisplayName(
    Component,
  )}`;
  return WithThreadContextComponent;
};
