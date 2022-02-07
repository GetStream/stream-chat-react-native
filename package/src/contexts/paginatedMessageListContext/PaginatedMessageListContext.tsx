import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState, ExtendableGenerics } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type PaginatedMessageListContextValue<
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
> = {
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
  messages: ChannelState<StreamChatClient>['messages'];
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

export const PaginatedMessageListProvider = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value?: PaginatedMessageListContextValue<StreamChatClient>;
}>) => (
  <PaginatedMessageListContext.Provider
    value={value as unknown as PaginatedMessageListContextValue}
  >
    {children}
  </PaginatedMessageListContext.Provider>
);

export const usePaginatedMessageListContext = <
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>() =>
  useContext(
    PaginatedMessageListContext,
  ) as unknown as PaginatedMessageListContextValue<StreamChatClient>;

/**
 * Typescript currently does not support partial inference so if MessageListContextValue
 * typing is desired while using the HOC withMessageListContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withPaginatedMessageListContext = <
  P extends UnknownType,
  StreamChatClient extends ExtendableGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof PaginatedMessageListContextValue<StreamChatClient>>> => {
  const WithPaginatedMessageListContextComponent = (
    props: Omit<P, keyof PaginatedMessageListContextValue<StreamChatClient>>,
  ) => {
    const paginatedMessageListContext = usePaginatedMessageListContext<StreamChatClient>();

    return <Component {...(props as P)} {...paginatedMessageListContext} />;
  };
  WithPaginatedMessageListContextComponent.displayName = `WithPaginatedMessageListContext${getDisplayName(
    Component,
  )}`;
  return WithPaginatedMessageListContextComponent;
};
