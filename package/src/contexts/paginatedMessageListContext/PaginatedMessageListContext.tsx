import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { StreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type PaginatedMessageListContextValue<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = {
  /**
   * Has more messages to load
   */
  hasMore: boolean;
  /**
   * Is loading more messages
   */
  loadingMore: boolean;
  /**
   * Is loading more recent messages
   */
  loadingMoreRecent: boolean;
  /**
   * Load more messages
   */
  loadMore: (limit?: number) => Promise<void>;
  /**
   * Load more recent messages
   */
  loadMoreRecent: (limit?: number) => Promise<void>;
  /**
   * Messages from client state
   */
  messages: ChannelState<At, Ch, Co, Ev, Me, Re, Us>['messages'];
  /**
   * Set loadingMore
   */
  setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Set loadingMoreRecent
   */
  setLoadingMoreRecent: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PaginatedMessageListContext = React.createContext(
  {} as PaginatedMessageListContextValue,
);

export const PaginatedMessageListProvider = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>({
  children,
  value,
}: PropsWithChildren<{
  value?: PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>;
}>) => (
  <PaginatedMessageListContext.Provider
    value={value as unknown as PaginatedMessageListContextValue}
  >
    {children}
  </PaginatedMessageListContext.Provider>
);

export const usePaginatedMessageListContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>() =>
  useContext(PaginatedMessageListContext) as unknown as PaginatedMessageListContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >;

/**
 * Typescript currently does not support partial inference so if MessageListContextValue
 * typing is desired while using the HOC withMessageListContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withPaginatedMessageListContext = <P extends UnknownType, StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>>> => {
  const WithPaginatedMessageListContextComponent = (
    props: Omit<P, keyof PaginatedMessageListContextValue<At, Ch, Co, Ev, Me, Re, Us>>,
  ) => {
    const paginatedMessageListContext =
      usePaginatedMessageListContext<At, Ch, Co, Ev, Me, Re, Us>();

    return <Component {...(props as P)} {...paginatedMessageListContext} />;
  };
  WithPaginatedMessageListContextComponent.displayName = `WithPaginatedMessageListContext${getDisplayName(
    Component,
  )}`;
  return WithPaginatedMessageListContextComponent;
};
