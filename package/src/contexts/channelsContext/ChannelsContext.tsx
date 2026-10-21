import React, { PropsWithChildren, useContext } from 'react';

import type { FlatListProps } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';

import type { Channel, ChannelPaginator } from 'stream-chat';

import type { GetChannelActionItems } from '../../hooks/actions/useChannelActionItems';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelsContextValue = {
  /**
   * Extra props for the underlying FlatList. Use `setFlatListRef` rather than these to get the ref.
   *
   * ```
   * <ChannelList additionalFlatListProps={{ bounces: true }} />
   * ```
   */
  additionalFlatListProps: Partial<FlatListProps<Channel>>;
  /**
   * The FlatList `onEndReachedThreshold`, in multiples of the visible list length. Defaults to 0.1.
   */
  loadMoreThreshold: number;
  /** Loads the next page of channels. */
  loadNextPage: () => Promise<void>;
  /** Highest unread count shown in the badge, which caps larger counts. Defaults to 255. */
  maxUnreadCount: number;
  /** Number of skeleton rows shown while loading. Defaults to 8. */
  numberOfSkeletons: number;
  /**
   * The list's `ChannelPaginator`. Read the loaded channels and the query state from
   * `paginator.state`, e.g. `useStateStore(paginator.state, selector)`.
   */
  paginator: ChannelPaginator;
  /**
   * Re-queries the first page while keeping the current channels on screen, unlike `reloadList`.
   * Ignored within 5 seconds of the previous refresh unless the list is in an error state.
   */
  refreshList: () => void | Promise<void>;
  /** Clears the channels from the UI and loads the first page again. */
  reloadList: () => Promise<void>;
  /**
   * Receives the inner FlatList ref, and `null` on unmount.
   *
   * ```
   * <ChannelList setFlatListRef={(ref) => { listRef.current = ref; }} />
   * ```
   */
  setFlatListRef: (ref: FlatList<Channel> | null) => void;
  /**
   * Called when a channel is tapped. Bridges `ChannelList` and `Channel`.
   *
   * @param channel The tapped channel.
   */
  onSelect?: (channel: Channel) => void;
  getChannelActionItems?: GetChannelActionItems;
  swipeActionsEnabled?: boolean;

  mutedStatusPosition?: 'trailingBottom' | 'inlineTitle';
  pinnedStatusPosition?: 'trailingBottom' | 'inlineTitle';
};

export const ChannelsContext = React.createContext(
  DEFAULT_BASE_CONTEXT_VALUE as ChannelsContextValue,
);

export const ChannelsProvider = ({
  children,
  value,
}: PropsWithChildren<{
  value: ChannelsContextValue;
}>) => (
  <ChannelsContext.Provider value={value as unknown as ChannelsContextValue}>
    {children}
  </ChannelsContext.Provider>
);

export const useChannelsContext = () => {
  const contextValue = useContext(ChannelsContext) as unknown as ChannelsContextValue;

  if (contextValue === DEFAULT_BASE_CONTEXT_VALUE && !isTestEnvironment()) {
    throw new Error(
      'The useChannelsContext hook was called outside of the ChannelsContext provider. Make sure you have configured ChannelList component correctly - https://getstream.io/chat/docs/sdk/react-native/core-components/channel-list/',
    );
  }

  return contextValue;
};
