import React, { useEffect, useState } from 'react';

import type { FlatList } from 'react-native-gesture-handler';

import type { Channel, ChannelFilters, ChannelOptions, ChannelSort, Event } from 'stream-chat';

import { ChannelListFooterLoadingIndicator } from './ChannelListFooterLoadingIndicator';
import { ChannelListHeaderErrorIndicator } from './ChannelListHeaderErrorIndicator';
import { ChannelListHeaderNetworkDownIndicator } from './ChannelListHeaderNetworkDownIndicator';
import { ChannelListLoadingIndicator } from './ChannelListLoadingIndicator';
import { ChannelListMessenger, ChannelListMessengerProps } from './ChannelListMessenger';
import { useAddedToChannelNotification } from './hooks/listeners/useAddedToChannelNotification';
import { useChannelDeleted } from './hooks/listeners/useChannelDeleted';
import { useChannelHidden } from './hooks/listeners/useChannelHidden';
import { useChannelTruncated } from './hooks/listeners/useChannelTruncated';
import { useChannelUpdated } from './hooks/listeners/useChannelUpdated';
import { useChannelVisible } from './hooks/listeners/useChannelVisible';
import { useNewMessage } from './hooks/listeners/useNewMessage';
import { useNewMessageNotification } from './hooks/listeners/useNewMessageNotification';
import { useRemovedFromChannelNotification } from './hooks/listeners/useRemovedFromChannelNotification';
import { useUserPresence } from './hooks/listeners/useUserPresence';
import { useCreateChannelsContext } from './hooks/useCreateChannelsContext';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';
import { Skeleton as SkeletonDefault } from './Skeleton';

import {
  ChannelsContextValue,
  ChannelsProvider,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { upsertCidsForQuery } from '../../store/apis/upsertCidsForQuery';
import type { DefaultStreamChatGenerics } from '../../types/types';
import { ChannelPreviewMessenger } from '../ChannelPreview/ChannelPreviewMessenger';
import { EmptyStateIndicator as EmptyStateIndicatorDefault } from '../Indicators/EmptyStateIndicator';
import { LoadingErrorIndicator as LoadingErrorIndicatorDefault } from '../Indicators/LoadingErrorIndicator';

export type ChannelListProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Partial<
  Pick<
    ChannelsContextValue<StreamChatGenerics>,
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
    | 'PreviewStatus'
    | 'PreviewTitle'
    | 'PreviewUnreadCount'
    | 'loadMoreThreshold'
    | 'Skeleton'
    | 'maxUnreadCount'
    | 'numberOfSkeletons'
  >
> & {
  /**
   * Object containing channel query filters
   *
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available filter fields
   *
   * @overrideType object
   * */
  filters?: ChannelFilters<StreamChatGenerics>;
  /**
   * Custom UI component to display the list of channels
   *
   * Default: [ChannelListMessenger](https://getstream.io/chat/docs/sdk/reactnative/ui-components/channel-list-messenger/)
   */
  List?: React.ComponentType<ChannelListMessengerProps<StreamChatGenerics>>;
  /**
   * If set to true, channels won't dynamically sort by most recent message, defaults to false
   */
  lockChannelOrder?: boolean;
  /**
   * Function that overrides default behavior when a user gets added to a channel
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event Object](https://getstream.io/chat/docs/event_object) corresponding to `notification.added_to_channel` event
   *
   * @overrideType Function
   * */
  onAddedToChannel?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
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
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
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
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
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
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
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
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
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
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
  ) => void;
  /**
   * Override the default listener/handler for event `notification.message_new`
   * This event is received on channel, which is not being watched.
   *
   * @param setChannels Setter for internal state property - `channels`. It's created from useState() hook.
   * @param event An [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.message_new` event
   *
   * @overrideType Function
   * */
  onMessageNew?: (
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
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
    setChannels: React.Dispatch<React.SetStateAction<Channel<StreamChatGenerics>[] | null>>,
    event: Event<StreamChatGenerics>,
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
  sort?: ChannelSort<StreamChatGenerics>;
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
export const ChannelList = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelListProps<StreamChatGenerics>,
) => {
  const {
    additionalFlatListProps = {},
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    FooterLoadingIndicator = ChannelListFooterLoadingIndicator,
    filters = DEFAULT_FILTERS,
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
    onChannelVisible,
    onChannelTruncated,
    onChannelUpdated,
    onMessageNew,
    onRemovedFromChannel,
    onSelect,
    options = DEFAULT_OPTIONS,
    Preview = ChannelPreviewMessenger,
    PreviewAvatar,
    PreviewMessage,
    PreviewStatus,
    PreviewTitle,
    PreviewUnreadCount,
    setFlatListRef,
    Skeleton = SkeletonDefault,
    sort = DEFAULT_SORT,
  } = props;

  const [forceUpdate, setForceUpdate] = useState(0);
  const { enableOfflineSupport } = useChatContext<StreamChatGenerics>();
  const {
    channels,
    error,
    hasNextPage,
    loadingChannels,
    loadingNextPage,
    loadNextPage,
    refreshing,
    refreshList,
    reloadList,
    setChannels,
    staticChannelsActive,
  } = usePaginatedChannels<StreamChatGenerics>({
    enableOfflineSupport,
    filters,
    options,
    setForceUpdate,
    sort,
  });

  // Setup event listeners
  useAddedToChannelNotification({
    onAddedToChannel,
    setChannels,
  });

  useChannelDeleted({
    onChannelDeleted,
    setChannels,
  });

  useChannelHidden({
    onChannelHidden,
    setChannels,
  });

  useChannelTruncated({
    onChannelTruncated,
    refreshList,
    setChannels,
    setForceUpdate,
  });

  useChannelUpdated({
    onChannelUpdated,
    setChannels,
  });

  useChannelVisible({
    onChannelVisible,
    setChannels,
  });

  useNewMessage({
    lockChannelOrder,
    setChannels,
  });

  useNewMessageNotification({
    onMessageNew,
    setChannels,
  });

  useRemovedFromChannelNotification({
    onRemovedFromChannel,
    setChannels,
  });

  useUserPresence({
    setChannels,
  });

  const channelIdsStr = channels?.reduce((acc, channel) => `${acc}${channel.cid}`, '');

  useEffect(() => {
    if (channels === null || staticChannelsActive || !enableOfflineSupport) {
      return;
    }

    upsertCidsForQuery({
      cids: channels.map((c) => c.cid),
      filters,
      sort,
    });
  }, [channelIdsStr, staticChannelsActive]);

  const channelsContext = useCreateChannelsContext({
    additionalFlatListProps,
    channels,
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
    PreviewStatus,
    PreviewTitle,
    PreviewUnreadCount,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef: (ref: FlatList<Channel<StreamChatGenerics>> | null) => {
      if (setFlatListRef) {
        setFlatListRef(ref);
      }
    },
    Skeleton,
  });

  return (
    <ChannelsProvider value={channelsContext}>
      <List<StreamChatGenerics> />
    </ChannelsProvider>
  );
};
