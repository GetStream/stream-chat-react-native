import React, { useEffect, useMemo, useState } from 'react';

import type { FlatList } from 'react-native-gesture-handler';

import { Channel, ChannelFilters, ChannelOptions, ChannelSort, Event } from 'stream-chat';

import { ChannelListFooterLoadingIndicator } from './ChannelListFooterLoadingIndicator';
import { ChannelListHeaderErrorIndicator } from './ChannelListHeaderErrorIndicator';
import { ChannelListHeaderNetworkDownIndicator } from './ChannelListHeaderNetworkDownIndicator';
import { ChannelListLoadingIndicator } from './ChannelListLoadingIndicator';
import { ChannelListMessenger, ChannelListMessengerProps } from './ChannelListMessenger';
import { useChannelUpdated } from './hooks/listeners/useChannelUpdated';
import { useCreateChannelsContext } from './hooks/useCreateChannelsContext';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';
import { Skeleton as SkeletonDefault } from './Skeleton';

import {
  ChannelsContextValue,
  ChannelsProvider,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import type { ChannelListEventListenerOptions } from '../../types/types';
import { ChannelPreviewMessenger } from '../ChannelPreview/ChannelPreviewMessenger';
import { EmptyStateIndicator as EmptyStateIndicatorDefault } from '../Indicators/EmptyStateIndicator';
import { LoadingErrorIndicator as LoadingErrorIndicatorDefault } from '../Indicators/LoadingErrorIndicator';

export type ChannelListProps = Partial<
  Pick<
    ChannelsContextValue,
    | 'additionalFlatListProps'
    | 'EmptyStateIndicator'
    | 'FooterLoadingIndicator'
    | 'HeaderErrorIndicator'
    | 'HeaderNetworkDownIndicator'
    | 'LoadingErrorIndicator'
    | 'LoadingIndicator'
    | 'Preview'
    | 'setFlatListRef'
    | 'ListHeaderComponent'
    | 'onSelect'
    | 'PreviewAvatar'
    | 'PreviewMessage'
    | 'PreviewMutedStatus'
    | 'PreviewStatus'
    | 'PreviewTitle'
    | 'PreviewUnreadCount'
    | 'loadMoreThreshold'
    | 'Skeleton'
    | 'maxUnreadCount'
    | 'numberOfSkeletons'
  >
> & {
  /** Optional function to filter channels prior to rendering the list. Do not use any complex logic that would delay the loading of the ChannelList. We recommend using a pure function with array methods like filter/sort/reduce. */
  channelRenderFilterFn?: (channels: Array<Channel>) => Array<Channel>;
  /**
   * Object containing channel query filters
   *
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available filter fields
   *
   * @overrideType object
   * */
  filters?: ChannelFilters;
  /**
   * Custom UI component to display the list of channels
   *
   * Default: [ChannelListMessenger](https://getstream.io/chat/docs/sdk/reactnative/ui-components/channel-list-messenger/)
   */
  List?: React.ComponentType<ChannelListMessengerProps>;
  /**
   * If set to true, channels won't dynamically sort by most recent message, defaults to false
   */
  lockChannelOrder?: boolean;
  /**
   * Function that overrides default behavior when a user gets added to a channel
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event Object](https://getstream.io/chat/docs/event_object) corresponding to `notification.added_to_channel` event
   * @param filters Channel filters
   * @param sort Channel sort options
   *
   * @overrideType Function
   * */
  onAddedToChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
    options?: ChannelListEventListenerOptions,
  ) => void;
  /**
   * Function that overrides default behavior when a channel gets deleted. In absence of this prop, the channel will be removed from the list.
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.deleted` event
   *
   * @overrideType Function
   * */
  onChannelDeleted?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
  ) => void;
  /**
   * Function that overrides default behavior when a channel gets hidden. In absence of this prop, the channel will be removed from the list.
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.hidden` event
   *
   * @overrideType Function
   * */
  onChannelHidden?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
  ) => void;
  /**
   * Function that overrides default behavior when a channel member.updated event is triggered
   * @param lockChannelOrder If set to true, channels won't dynamically sort by most recent message, defaults to false
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `member.updated` event
   * @param filters Channel filters
   * @param sort Channel sort options
   * @overrideType Function
   */
  onChannelMemberUpdated?: (
    lockChannelOrder: boolean,
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
    options?: ChannelListEventListenerOptions,
  ) => void;
  /**
   * Function to customize behavior when a channel gets truncated
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.truncated` event
   *
   * @overrideType Function
   * */
  onChannelTruncated?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
  ) => void;
  /**
   * Function that overrides default behavior when a channel gets updated
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.updated` event
   *
   * @overrideType Function
   * */
  onChannelUpdated?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
  ) => void;
  /**
   * Function that overrides default behavior when a channel gets visible. In absence of this prop, the channel will be added to the list.
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.visible` event
   *
   * @overrideType Function
   * */
  onChannelVisible?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
  ) => void;
  /**
   * Override the default listener/handler for event `message.new`
   * This event is received on channel, when a new message is added on a channel.
   *
   * @param lockChannelOrder If set to true, channels won't dynamically sort by most recent message, defaults to false
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `message.new` event
   * @param considerArchivedChannels If set to true, archived channels will be considered while updating the list of channels
   * @param filters Channel filters
   * @param sort Channel sort options
   * @overrideType Function
   * */
  onNewMessage?: (
    lockChannelOrder: boolean,
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
    options?: ChannelListEventListenerOptions,
  ) => void;
  /**
   * Override the default listener/handler for event `notification.message_new`
   * This event is received on channel, which is not being watched.
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.message_new` event
   * @param filters Channel filters
   * @overrideType Function
   * */
  onNewMessageNotification?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
    options?: ChannelListEventListenerOptions,
  ) => void;

  /**
   * Function that overrides default behavior when a user gets removed from a channel
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.removed_from_channel` event
   *
   * @overrideType Function
   * */
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel[]>>,
    event: Event,
  ) => void;
  /**
   * Object containing channel query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available option fields
   * */
  options?: ChannelOptions;
  /**
   * Object containing channel sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available sorting fields
   * */
  sort?: ChannelSort;
};

const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT = {};

/**
 * This component fetches a list of channels, allowing you to select the channel you want to open.
 * The ChannelList doesn't provide any UI for the underlying React Native FlatList. UI is determined by the `List` component which is
 * provided to the ChannelList component as a prop. By default, the ChannelListMessenger component is used as the list UI.
 *
 * @example ./ChannelList.md
 */
export const ChannelList = (props: ChannelListProps) => {
  const {
    additionalFlatListProps = {},
    channelRenderFilterFn,
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    filters = DEFAULT_FILTERS,
    FooterLoadingIndicator = ChannelListFooterLoadingIndicator,
    HeaderErrorIndicator = ChannelListHeaderErrorIndicator,
    HeaderNetworkDownIndicator = ChannelListHeaderNetworkDownIndicator,
    List = ChannelListMessenger,
    ListHeaderComponent,
    LoadingErrorIndicator = LoadingErrorIndicatorDefault,
    LoadingIndicator = ChannelListLoadingIndicator,
    // https://stackoverflow.com/a/60666252/10826415
    loadMoreThreshold = 0.1,
    lockChannelOrder = false,
    maxUnreadCount = 255,
    numberOfSkeletons = 6,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelMemberUpdated,
    onChannelTruncated,
    onChannelUpdated,
    onChannelVisible,
    onNewMessage,
    onNewMessageNotification,
    onRemovedFromChannel,
    onSelect,
    options = DEFAULT_OPTIONS,
    Preview = ChannelPreviewMessenger,
    PreviewAvatar,
    PreviewMessage,
    PreviewMutedStatus,
    PreviewStatus,
    PreviewTitle,
    PreviewUnreadCount,
    setFlatListRef,
    Skeleton = SkeletonDefault,
    sort = DEFAULT_SORT,
  } = props;

  const [forceUpdate, setForceUpdate] = useState(0);
  const { client, enableOfflineSupport } = useChatContext();
  const channelManager = useMemo(() => client.createChannelManager({}), [client]);

  /**
   * This hook sets the event handler overrides in the channelManager internally
   * whenever they change. We do this to avoid recreating the channelManager instance
   * every time these change, as we want to keep it as static as possible.
   * This protects us from something like defining the overrides as inline functions
   * causing the manager instance to be recreated over and over again.
   */
  useEffect(() => {
    channelManager.setEventHandlerOverrides({
      channelDeletedHandler: onChannelDeleted,
      channelHiddenHandler: onChannelHidden,
      channelTruncatedHandler: onChannelTruncated,
      channelVisibleHandler: onChannelVisible,
      memberUpdatedHandler: onChannelMemberUpdated
        ? (setChannels, event) =>
            onChannelMemberUpdated(lockChannelOrder, setChannels, event, { filters, sort })
        : undefined,
      newMessageHandler: onNewMessage
        ? (setChannels, event) =>
            onNewMessage(lockChannelOrder, setChannels, event, { filters, sort })
        : undefined,
      notificationAddedToChannelHandler: onAddedToChannel
        ? (setChannels, event) => onAddedToChannel(setChannels, event, { filters, sort })
        : undefined,
      notificationNewMessageHandler: onNewMessageNotification
        ? (setChannels, event) => onNewMessageNotification(setChannels, event, { filters, sort })
        : undefined,
      notificationRemovedFromChannelHandler: onRemovedFromChannel,
    });
  }, [
    channelManager,
    filters,
    lockChannelOrder,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelMemberUpdated,
    onChannelTruncated,
    onChannelVisible,
    onNewMessage,
    onNewMessageNotification,
    onRemovedFromChannel,
    sort,
  ]);

  useEffect(() => {
    channelManager.setOptions({ abortInFlightQuery: false, lockChannelOrder });
  }, [channelManager, lockChannelOrder]);

  useEffect(() => {
    channelManager.registerSubscriptions();

    return () => {
      channelManager.unregisterSubscriptions();
    };
  }, [channelManager]);

  const {
    channelListInitialized,
    channels,
    error,
    hasNextPage,
    loadingChannels,
    loadingNextPage,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
  } = usePaginatedChannels({
    channelManager,
    enableOfflineSupport,
    filters,
    options,
    setForceUpdate,
    sort,
  });

  useChannelUpdated({
    onChannelUpdated,
    setChannels: channelManager.setChannels,
  });

  const channelsContext = useCreateChannelsContext({
    additionalFlatListProps,
    channelListInitialized,
    channels: channelRenderFilterFn ? channelRenderFilterFn(channels ?? []) : channels,
    EmptyStateIndicator,
    error,
    FooterLoadingIndicator,
    forceUpdate,
    hasNextPage,
    HeaderErrorIndicator,
    HeaderNetworkDownIndicator,
    ListHeaderComponent,
    loadingChannels,
    LoadingErrorIndicator,
    LoadingIndicator,
    loadingNextPage,
    loadMoreThreshold,
    loadNextPage,
    maxUnreadCount,
    numberOfSkeletons,
    onSelect,
    Preview,
    PreviewAvatar,
    PreviewMessage,
    PreviewMutedStatus,
    PreviewStatus,
    PreviewTitle,
    PreviewUnreadCount,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef: (ref: FlatList<Channel> | null) => {
      if (setFlatListRef) {
        setFlatListRef(ref);
      }
    },
    Skeleton,
  });

  return (
    <ChannelsProvider value={channelsContext}>
      <List />
    </ChannelsProvider>
  );
};
