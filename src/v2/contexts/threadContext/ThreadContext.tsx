import React, { PropsWithChildren, useContext } from 'react';

import { getDisplayName } from '../utils/getDisplayName';

import type { ChannelState } from 'stream-chat';

import type { MessageWithDates } from '../messagesContext/MessagesContext';
import type { Message } from '../../components/MessageList/hooks/useMessageList';
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
  closeThread: () => void;
  loadMoreThread: () => Promise<void>;
  openThread: (message: Message<At, Ch, Co, Ev, Me, Re, Us>) => void;
  thread:
    | ReturnType<ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messageToImmutable']>
    | MessageWithDates<At, Ch, Co, Me, Re, Us>
    | null;
  threadHasMore: boolean;
  threadLoadingMore: boolean;
  threadMessages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['threads'][string];
};

export const ThreadContext = React.createContext({} as ThreadContextValue);

const areEqual = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  prevProps: PropsWithChildren<{
    value: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
  nextProps: PropsWithChildren<{
    value: ThreadContextValue<At, Ch, Co, Ev, Me, Re, Us>;
  }>,
) => {
  const {
    value: {
      thread: prevThread,
      threadHasMore: prevThreadHasMore,
      threadLoadingMore: prevThreadLoadingMore,
      threadMessages: prevThreadMessage,
    },
  } = prevProps;
  const {
    value: {
      thread: nextThread,
      threadHasMore: nextThreadHasMore,
      threadLoadingMore: nextThreadLoadingMore,
      threadMessages: nextThreadMessages,
    },
  } = nextProps;

  const threadHasMoreEqual = prevThreadHasMore === nextThreadHasMore;
  if (!threadHasMoreEqual) return false;

  const threadLoadingMoreEqual =
    prevThreadLoadingMore === nextThreadLoadingMore;
  if (!threadLoadingMoreEqual) return false;

  const threadEqual =
    !!prevThread && !!nextThread && prevThread.id === nextThread.id;
  if (!threadEqual) return false;

  const threadMessagesEqual =
    prevThreadMessage.length === nextThreadMessages.length;
  if (!threadMessagesEqual) return false;

  return true;
};

const ThreadProviderMemoized = React.memo(
  ThreadContext.Provider,
  areEqual,
) as typeof ThreadContext.Provider;

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
  <ThreadProviderMemoized value={(value as unknown) as ThreadContextValue}>
    {children}
  </ThreadProviderMemoized>
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
