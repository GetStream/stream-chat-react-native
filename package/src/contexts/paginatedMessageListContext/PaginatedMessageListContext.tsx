import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { getDisplayName } from '../utils/getDisplayName';

export type PaginatedMessageListContextValue<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
  messages: ChannelState<StreamChatGenerics>['messages'];
  /**
   * Set loadingMore
   */
  setLoadingMore: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Set loadingMoreRecent
   */
  setLoadingMoreRecent: React.Dispatch<React.SetStateAction<boolean>>;
};

export const PaginatedMessageListContext =
  React.createContext<PaginatedMessageListContextValue | undefined>(undefined);

export const PaginatedMessageListProvider = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
  value,
}: PropsWithChildren<{
  value?: PaginatedMessageListContextValue<StreamChatGenerics>;
}>) => (
  <PaginatedMessageListContext.Provider
    value={value as unknown as PaginatedMessageListContextValue}
  >
    {children}
  </PaginatedMessageListContext.Provider>
);

export const usePaginatedMessageListContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  componentName?: string,
) => {
  const contextValue = useContext(
    PaginatedMessageListContext,
  ) as unknown as PaginatedMessageListContextValue<StreamChatGenerics>;

  if (!contextValue) {
    console.warn(
      `The usePaginatedMessageListContext hook was called outside of the PaginatedMessageList provider. Make sure this hook is called within a child of the PaginatedMessageListProvider component within Channel component. The errored call is located in the ${componentName} component.`,
    );

    return {} as PaginatedMessageListContextValue<StreamChatGenerics>;
  }

  return contextValue as PaginatedMessageListContextValue<StreamChatGenerics>;
};

/**
 * Typescript currently does not support partial inference so if MessageListContextValue
 * typing is desired while using the HOC withMessageListContext the Props for the
 * wrapped component must be provided as the first generic.
 */
export const withPaginatedMessageListContext = <
  P extends UnknownType,
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  Component: React.ComponentType<P>,
): React.FC<Omit<P, keyof PaginatedMessageListContextValue<StreamChatGenerics>>> => {
  const WithPaginatedMessageListContextComponent = (
    props: Omit<P, keyof PaginatedMessageListContextValue<StreamChatGenerics>>,
  ) => {
    const paginatedMessageListContext = usePaginatedMessageListContext<StreamChatGenerics>();

    return <Component {...(props as P)} {...paginatedMessageListContext} />;
  };
  WithPaginatedMessageListContextComponent.displayName = `WithPaginatedMessageListContext${getDisplayName(
    Component,
  )}`;
  return WithPaginatedMessageListContextComponent;
};
