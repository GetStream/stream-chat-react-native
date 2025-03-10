import React, { PropsWithChildren, useContext } from 'react';

import type { ChannelState } from 'stream-chat';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type PaginatedMessageListContextValue = {
  /**
   * Load latest messages
   * @returns Promise<void>
   */
  loadLatestMessages: () => Promise<void>;
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
  messages: ChannelState['messages'];
  /**
   * Has more messages to load
   */
  hasMore?: boolean;
  /**
   * Is loading more messages
   */
  loadingMore?: boolean;
  /**
   * Is loading more recent messages
   */
  loadingMoreRecent?: boolean;
  /**
   * Set loadingMore
   */
  setLoadingMore?: (loadingMore: boolean) => void;
  /**
   * Set loadingMoreRecent
   */
  setLoadingMoreRecent?: (loadingMoreRecent: boolean) => void;
};

export const PaginatedMessageListContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as PaginatedMessageListContextValue,
);

export const PaginatedMessageListProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value?: PaginatedMessageListContextValue;
}>) => (
  <PaginatedMessageListContext.Provider
    value={value as unknown as PaginatedMessageListContextValue}
  >
    {children}
  </PaginatedMessageListContext.Provider>
);

export const usePaginatedMessageListContext = () => {
  const contextValue = useContext(
    PaginatedMessageListContext,
  ) as unknown as PaginatedMessageListContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The usePaginatedMessageListContext hook was called outside of the PaginatedMessageList provider. Make sure you have configured Channel component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel',
    );
  }

  return contextValue;
};
