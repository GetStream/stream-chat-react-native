import React, { PropsWithChildren, useContext } from 'react';

import type { FlatListProps } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';

import type { Channel } from 'stream-chat';

import type { GetChannelActionItems } from '../../components/ChannelList/hooks/useChannelActionItems';
import type { QueryChannels } from '../../components/ChannelList/hooks/usePaginatedChannels';
import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelsContextValue = {
  /**
   * Besides the existing default behavior of the ChannelListView component, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **EXAMPLE:**
   *
   * ```
   * <ChannelListView
   *  channels={channels}
   *  additionalFlatListProps={{ bounces: true }}
   * />
   * ```
   *
   * **Note:** Don't use `additionalFlatListProps` to access the FlatList ref, use `setFlatListRef`
   */
  additionalFlatListProps: Partial<FlatListProps<Channel>>;
  /**
   * A control prop used to determine whether the first query of the channel list has succeeded.
   */
  channelListInitialized: boolean;
  /**
   * Channels can be either an array of channels or a promise which resolves to an array of channels
   */
  channels: Channel[] | null;
  /**
   * Incremental number change to force update the FlatList
   */
  forceUpdate: number;
  /**
   * Whether or not the FlatList has another page to render
   */
  hasNextPage: boolean;
  /**
   * Initial channels query loading state, triggers the LoadingIndicator
   */
  loadingChannels: boolean;
  /**
   * Whether or not additional channels are being loaded, triggers the
   * ChannelListFooterLoadingIndicator
   */
  loadingNextPage: boolean;
  /**
   * The React Native FlatList threshold to fetch more data
   * @see See loadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
   * */
  loadMoreThreshold: number;
  /**
   * Loads the next page of `channels`, which is present as a required prop
   */
  loadNextPage: QueryChannels;
  /**
   * Max number to display within notification badge. Default: 255 and it cannot be higher than that for now due to backend limitations
   */
  maxUnreadCount: number;
  /**
   * Number of skeletons that should show when loading. Default: 6
   */
  numberOfSkeletons: number;
  /**
   * Triggered when the channel list is refreshing, displays a loading spinner at the top of the list
   */
  refreshing: boolean;
  /**
   * Function to refresh the channel list that is similar to `reloadList`, but it doesn't wipe out existing channels
   * from UI before loading the new ones
   */
  refreshList: () => void | Promise<void>;
  /**
   * Removes all the existing channels from UI and loads fresh channels
   * */
  reloadList: () => Promise<void>;
  // /**
  //  * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
  //  *
  //  * @param channel A channel object
  //  */
  // setActiveChannel?: (channel: Channel) => void;
  /**
   * Function to gain access to the inner FlatList ref
   *
   * **Example:**
   *
   * ```
   * <ChannelListView
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own good
   *  }}
   * ```
   */
  setFlatListRef: (ref: FlatList<Channel> | null) => void;
  /**
   * Error in channels query, if any
   */
  error?: Error;
  /**
   * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
   *
   * @param channel A channel object
   */
  onSelect?: (channel: Channel) => void;
  getChannelActionItems?: GetChannelActionItems;
  swipeActionsEnabled?: boolean;

  mutedStatusPosition?: 'trailingBottom' | 'inlineTitle';
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
      'The useChannelsContext hook was called outside of the ChannelsContext provider. Make sure you have configured ChannelList component correctly - https://getstream.io/chat/docs/sdk/reactnative/basics/hello_stream_chat/#channel-list',
    );
  }

  return contextValue;
};
