import React, { PropsWithChildren, useContext } from 'react';

import type { FlatListProps } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';

import type { Channel } from 'stream-chat';

import type { HeaderErrorProps } from '../../components/ChannelList/ChannelListHeaderErrorIndicator';
import type { QueryChannels } from '../../components/ChannelList/hooks/usePaginatedChannels';
import type { ChannelAvatarProps } from '../../components/ChannelPreview/ChannelAvatar';
import type { ChannelPreviewMessageProps } from '../../components/ChannelPreview/ChannelPreviewMessage';
import type { ChannelPreviewMessengerProps } from '../../components/ChannelPreview/ChannelPreviewMessenger';
import type { ChannelPreviewStatusProps } from '../../components/ChannelPreview/ChannelPreviewStatus';
import type { ChannelPreviewTitleProps } from '../../components/ChannelPreview/ChannelPreviewTitle';
import type { ChannelPreviewUnreadCountProps } from '../../components/ChannelPreview/ChannelPreviewUnreadCount';
import type { EmptyStateProps } from '../../components/Indicators/EmptyStateIndicator';
import type { LoadingErrorProps } from '../../components/Indicators/LoadingErrorIndicator';
import type { LoadingProps } from '../../components/Indicators/LoadingIndicator';

import { DEFAULT_BASE_CONTEXT_VALUE } from '../utils/defaultBaseContextValue';

import { isTestEnvironment } from '../utils/isTestEnvironment';

export type ChannelsContextValue = {
  /**
   * Besides the existing default behavior of the ChannelListMessenger component, you can attach
   * additional props to the underlying React Native FlatList.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **EXAMPLE:**
   *
   * ```
   * <ChannelListMessenger
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
   * Custom indicator to use when channel list is empty
   *
   * Default: [EmptyStateIndicator](https://getstream.io/chat/docs/sdk/reactnative/core-components/channel/#emptystateindicator)
   * */
  EmptyStateIndicator: React.ComponentType<EmptyStateProps>;
  /**
   * Custom loading indicator to display at bottom of the list, while loading further pages
   *
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.io/chat/docs/sdk/reactnative/contexts/channels-context/#footerloadingindicator)
   */
  FooterLoadingIndicator: React.ComponentType;
  /**
   * Incremental number change to force update the FlatList
   */
  forceUpdate: number;
  /**
   * Whether or not the FlatList has another page to render
   */
  hasNextPage: boolean;
  /**
   * Custom indicator to display error at top of list, if loading/pagination error occurs
   *
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.io/chat/docs/sdk/reactnative/contexts/channels-context/#headererrorindicator)
   */
  HeaderErrorIndicator: React.ComponentType<HeaderErrorProps>;
  /**
   * Custom indicator to display network-down error at top of list, if there is connectivity issue
   *
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.io/chat/docs/sdk/reactnative/contexts/channels-context/#headernetworkdownindicator)
   */
  HeaderNetworkDownIndicator: React.ComponentType;
  /**
   * Initial channels query loading state, triggers the LoadingIndicator
   */
  loadingChannels: boolean;
  /**
   * Custom indicator to use when there is error in fetching channels
   *
   * Default: [LoadingErrorIndicator](https://getstream.io/chat/docs/sdk/reactnative/contexts/channels-context/#loadingerrorindicator)
   * */
  LoadingErrorIndicator: React.ComponentType<LoadingErrorProps>;
  /**
   * Custom loading indicator to use on Channel List
   *
   * */
  LoadingIndicator: React.ComponentType<Pick<LoadingProps, 'listType'>>;
  /**
   * Whether or not additional channels are being loaded, triggers the FooterLoadingIndicator
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
   * Custom UI component to display individual channel list items
   *
   * Default: [ChannelPreviewMessenger](https://getstream.io/chat/docs/sdk/reactnative/ui-components/channel-preview-messenger/)
   */
  Preview: React.ComponentType<ChannelPreviewMessengerProps>;
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
   * <ChannelListMessenger
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own good
   *  }}
   * ```
   */
  setFlatListRef: (ref: FlatList<Channel> | null) => void;
  /**
   * Custom UI component to display loading channel skeletons
   *
   * Default: [Skeleton](https://getstream.io/chat/docs/sdk/reactnative/contexts/channels-context/#skeleton)
   */
  Skeleton: React.ComponentType;
  /**
   * Error in channels query, if any
   */
  error?: Error;
  ListHeaderComponent?: React.ComponentType;
  /**
   * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
   *
   * @param channel A channel object
   */
  onSelect?: (channel: Channel) => void;
  /**
   * Custom UI component to render preview avatar.
   *
   * **Default** [ChannelAvatar](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/ChannelPreview/ChannelAvatar.tsx)
   */
  PreviewAvatar?: React.ComponentType<ChannelAvatarProps>;
  /**
   * Custom UI component to render preview of latest message on channel.
   *
   * **Default** [ChannelPreviewMessage](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/ChannelPreview/ChannelPreviewMessage.tsx)
   */
  PreviewMessage?: React.ComponentType<ChannelPreviewMessageProps>;
  /**
   * Custom UI component to render muted status.
   *
   * **Default** [ChannelMutedStatus](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/ChannelPreview/ChannelPreviewMutedStatus.tsx)
   */
  PreviewMutedStatus?: React.ComponentType;
  /**
   * Custom UI component to render preview avatar.
   *
   * **Default** [ChannelPreviewStatus](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/ChannelPreview/ChannelPreviewStatus.tsx)
   */
  PreviewStatus?: React.ComponentType<ChannelPreviewStatusProps>;
  /**
   * Custom UI component to render preview avatar.
   *
   * **Default** [ChannelPreviewTitle](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/ChannelPreview/ChannelPreviewTitle.tsx)
   */
  PreviewTitle?: React.ComponentType<ChannelPreviewTitleProps>;
  /**
   * Custom UI component to render preview avatar.
   *
   * **Default** [ChannelPreviewUnreadCount](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/components/ChannelPreview/ChannelPreviewUnreadCount.tsx)
   */
  PreviewUnreadCount?: React.ComponentType<ChannelPreviewUnreadCountProps>;
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
