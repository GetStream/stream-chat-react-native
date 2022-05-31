import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import type { DefaultStreamChatGenerics, UnknownType } from '../../types/types';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { getDisplayName } from '../utils/getDisplayName';
import { isTestEnvironment } from '../utils/isTestEnvironment';

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

export const PaginatedMessageListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as PaginatedMessageListContextValue,
);

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
>() => {
  const contextValue = useContext(
    PaginatedMessageListContext,
  ) as unknown as PaginatedMessageListContextValue<StreamChatGenerics>;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      `The usePaginatedMessageListContext hook was called outside of the PaginatedMessageList provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel`,
    );
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
