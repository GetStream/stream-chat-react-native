import React, { useState } from 'react';

import {
  ChannelListMessenger,
  ChannelListMessengerProps,
} from './ChannelListMessenger';

import { useAddedToChannelNotification } from './hooks/listeners/useAddedToChannelNotification';
import { useChannelDeleted } from './hooks/listeners/useChannelDeleted';
import { useChannelHidden } from './hooks/listeners/useChannelHidden';
import { useChannelTruncated } from './hooks/listeners/useChannelTruncated';
import { useChannelUpdated } from './hooks/listeners/useChannelUpdated';
import { useConnectionRecovered } from './hooks/listeners/useConnectionRecovered';
import { useNewMessage } from './hooks/listeners/useNewMessage';
import { useNewMessageNotification } from './hooks/listeners/useNewMessageNotification';
import { usePaginatedChannels } from './hooks/usePaginatedChannels';
import { useRemovedFromChannelNotification } from './hooks/listeners/useRemovedFromChannelNotification';
import { useUserPresence } from './hooks/listeners/useUserPresence';

import { ChannelListFooterLoadingIndicator } from './ChannelListFooterLoadingIndicator';
import { ChannelListHeaderErrorIndicator } from './ChannelListHeaderErrorIndicator';
import { ChannelListHeaderNetworkDownIndicator } from './ChannelListHeaderNetworkDownIndicator';
import { Skeleton as SkeletonDefault } from './Skeleton';

import { ChannelPreviewMessenger } from '../ChannelPreview/ChannelPreviewMessenger';
import { EmptyStateIndicator as EmptyStateIndicatorDefault } from '../Indicators/EmptyStateIndicator';
import { LoadingErrorIndicator as LoadingErrorIndicatorDefault } from '../Indicators/LoadingErrorIndicator';
import { LoadingIndicator as LoadingIndicatorDefault } from '../Indicators/LoadingIndicator';

import {
  ChannelsContextValue,
  ChannelsProvider,
} from '../../contexts/channelsContext/ChannelsContext';

import type { FlatList } from 'react-native-gesture-handler';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  Event,
} from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../types/types';

export type ChannelListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = Partial<ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>> & {
  /**
   * Object containing channel query filters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available filter fields
   * */
  filters?: ChannelFilters<Ch, Co, Us>;
  /**
   * Custom UI component to display the list of channels
   *
   * Default: [ChannelListMessenger](https://getstream.github.io/stream-chat-react-native/#channellistmessenger)
   */
  List?: React.ComponentType<
    ChannelListMessengerProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  /**
   * If set to true, channels won't dynamically sort by most recent message, defaults to false
   */
  lockChannelOrder?: boolean;
  /**
   * Function that overrides default behavior when a user gets added to a channel
   *
   * @param {Event} event [Event Object](https://getstream.io/chat/docs/event_object) corresponding to `notification.added_to_channel` event
   * */
  onAddedToChannel?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * Function that overrides default behavior when a channel gets deleted. In absence of this prop, the channel will be removed from the list.
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.deleted` event
   * */
  onChannelDeleted?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * Function that overrides default behavior when a channel gets hidden. In absence of this prop, the channel will be removed from the list.
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.hidden` event
   * */
  onChannelHidden?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * Function to customize behavior when a channel gets truncated
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.truncated` event
   * */
  onChannelTruncated?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * Function that overrides default behavior when a channel gets updated
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.updated` event
   * */
  onChannelUpdated?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * Function that overrides default behavior when new message is received on channel not currently being watched
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.message_new` event
   * */
  onMessageNew?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void;
  /**
   * Function that overrides default behavior when a user gets removed from a channel
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.removed_from_channel` event
   * */
  onRemovedFromChannel?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Channel<At, Ch, Co, Ev, Me, Re, Us>[]>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
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
  sort?: ChannelSort<Ch>;
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
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelListProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalFlatListProps = {},
    EmptyStateIndicator = EmptyStateIndicatorDefault,
    FooterLoadingIndicator = ChannelListFooterLoadingIndicator,
    filters = DEFAULT_FILTERS,
    HeaderErrorIndicator = ChannelListHeaderErrorIndicator,
    HeaderNetworkDownIndicator = ChannelListHeaderNetworkDownIndicator,
    List = ChannelListMessenger,
    LoadingErrorIndicator = LoadingErrorIndicatorDefault,
    LoadingIndicator = LoadingIndicatorDefault,
    // https://github.com/facebook/react-native/blob/a7a7970e543959e9db5281914d5f132beb01db8d/Libraries/Lists/VirtualizedList.js#L466
    loadMoreThreshold = 2,
    lockChannelOrder = false,
    numberOfSkeletons = 6,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelTruncated,
    onChannelUpdated,
    onMessageNew,
    onRemovedFromChannel,
    onSelect,
    options = DEFAULT_OPTIONS,
    Preview = ChannelPreviewMessenger,
    setFlatListRef,
    Skeleton = SkeletonDefault,
    sort = DEFAULT_SORT,
  } = props;

  const [forceUpdate, setForceUpdate] = useState(0);

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
  } = usePaginatedChannels<At, Ch, Co, Ev, Me, Re, Us>({
    filters,
    options,
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
    setChannels,
    setForceUpdate,
  });

  useChannelUpdated({
    onChannelUpdated,
    setChannels,
  });

  useConnectionRecovered<At, Ch, Co, Ev, Me, Re, Us>({
    setForceUpdate,
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

  const channelsContext = {
    additionalFlatListProps,
    channels,
    EmptyStateIndicator,
    error,
    FooterLoadingIndicator,
    forceUpdate,
    hasNextPage,
    HeaderErrorIndicator,
    HeaderNetworkDownIndicator,
    loadingChannels,
    LoadingErrorIndicator,
    LoadingIndicator,
    loadingNextPage,
    loadMoreThreshold,
    loadNextPage,
    numberOfSkeletons,
    onSelect,
    Preview,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef: (
      ref: FlatList<Channel<At, Ch, Co, Ev, Me, Re, Us>> | null,
    ) => {
      if (setFlatListRef) {
        setFlatListRef(ref);
      }
    },
    Skeleton,
  };

  return (
    <ChannelsProvider value={channelsContext}>
      <List<At, Ch, Co, Ev, Me, Re, Us> />
    </ChannelsProvider>
  );
};
