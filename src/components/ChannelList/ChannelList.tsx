import React, { PropsWithChildren, useRef, useState } from 'react';
import type { FlatList, FlatListProps } from 'react-native';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  Event,
  UnknownType,
} from 'stream-chat';

import ChannelListMessenger, {
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

import type { HeaderErrorProps } from './ChannelListHeaderErrorIndicator';
import type { ChannelPreviewMessengerProps } from '../ChannelPreview/ChannelPreviewMessenger';
import type { EmptyStateProps } from '../Indicators/EmptyStateIndicator';
import type { LoadingErrorProps } from '../Indicators/LoadingErrorIndicator';
import type { LoadingProps } from '../Indicators/LoadingIndicator';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ChannelListProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /**
   * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
   *
   * @param channel A channel object
   * */
  onSelect: (channel: Channel<At, Ch, Co, Ev, Me, Re, Us>) => void;
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
  additionalFlatListProps?: FlatListProps<Channel<At, Ch, Co, Ev, Me, Re, Us>>;
  /**
   * Custom indicator to use when channel list is empty
   *
   * Default: [EmptyStateIndicator](https://getstream.github.io/stream-chat-react-native/#emptystateindicator)
   * */
  EmptyStateIndicator?: React.ComponentType<Partial<EmptyStateProps>>;
  /**
   * Object containing channel query filters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available filter fields
   * */
  filters?: ChannelFilters<Ch, Co, Us>;
  /**
   * Custom loading indicator to display at bottom of the list, while loading further pages
   *
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
   */
  FooterLoadingIndicator?: React.ComponentType;
  /**
   * Custom indicator to display error at top of list, if loading/pagination error occurs
   *
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
   */
  HeaderErrorIndicator?: React.ComponentType<Partial<HeaderErrorProps>>;
  /**
   * Custom indicator to display network-down error at top of list, if there is connectivity issue
   *
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
   */
  HeaderNetworkDownIndicator?: React.ComponentType;
  /**
   * Custom UI component to display the list of channels
   *
   * Default: [ChannelListMessenger](https://getstream.github.io/stream-chat-react-native/#channellistmessenger)
   */
  List?: React.ComponentType<
    Partial<ChannelListMessengerProps<At, Ch, Co, Ev, Me, Re, Us>>
  >;
  /**
   * Custom indicator to use when there is error in fetching channels
   *
   * Default: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react-native/#loadingerrorindicator)
   * */
  LoadingErrorIndicator?: React.ComponentType<Partial<LoadingErrorProps>>;
  /**
   * Custom loading indicator to use
   *
   * Default: [LoadingIndicator](https://getstream.github.io/stream-chat-react-native/#loadingindicator)
   * */
  LoadingIndicator?: React.ComponentType<Partial<LoadingProps>>;
  /**
   * The React Native FlatList threshold to fetch more data
   * @see See loadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
   * */
  loadMoreThreshold?: number;
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
   * Custom UI component to display individual channel list items
   *
   * Default: [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger)
   * */
  Preview?: React.ComponentType<
    Partial<ChannelPreviewMessengerProps<At, Ch, Co, Ev, Me, Re, Us>>
  >;
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
  setFlatListRef?: (
    ref: FlatList<Channel<At, Ch, Co, Ev, Me, Re, Us>> | null,
  ) => void;
  /**
   * Object containing channel sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available sorting fields
   * */
  sort?: ChannelSort<Ch>;
};

/**
 * This component fetches a list of channels, allowing you to select the channel you want to open.
 * The ChannelList doesn't provide any UI for the underlying React Native FlatList. UI is determined by the `List` component which is
 * provided to the ChannelList component as a prop. By default, the ChannelListMessenger component is used as the list UI.
 *
 * @example ../docs/ChannelList.md
 */
const ChannelList = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: PropsWithChildren<ChannelListProps<At, Ch, Co, Ev, Me, Re, Us>>,
) => {
  const {
    filters = {},
    List = ChannelListMessenger,
    lockChannelOrder = false,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelTruncated,
    onChannelUpdated,
    onMessageNew,
    onRemovedFromChannel,
    onSelect,
    options = {},
    setFlatListRef,
    sort = {},
  } = props;

  const listRef = useRef<FlatList<Channel<At, Ch, Co, Ev, Me, Re, Us>> | null>(
    null,
  );
  const [forceUpdate, setForceUpdate] = useState(0);

  const {
    channels,
    hasNextPage,
    loadNextPage,
    refreshList,
    reloadList,
    setChannels,
    status,
  } = usePaginatedChannels<At, Ch, Co, Ev, Me, Re, Us>({
    filters,
    options,
    sort,
  });

  // Setup event listeners
  useAddedToChannelNotification<At, Ch, Co, Ev, Me, Re, Us>({
    onAddedToChannel,
    setChannels,
  });

  useChannelDeleted<At, Ch, Co, Ev, Me, Re, Us>({
    onChannelDeleted,
    setChannels,
  });

  useChannelHidden<At, Ch, Co, Ev, Me, Re, Us>({
    onChannelHidden,
    setChannels,
  });

  useChannelTruncated<At, Ch, Co, Ev, Me, Re, Us>({
    onChannelTruncated,
    setChannels,
    setForceUpdate,
  });

  useChannelUpdated<At, Ch, Co, Ev, Me, Re, Us>({
    onChannelUpdated,
    setChannels,
  });

  useConnectionRecovered<At, Ch, Co, Ev, Me, Re, Us>({
    setForceUpdate,
  });

  useNewMessage<At, Ch, Co, Ev, Me, Re, Us>({
    lockChannelOrder,
    setChannels,
  });

  useNewMessageNotification<At, Ch, Co, Ev, Me, Re, Us>({
    onMessageNew,
    setChannels,
  });

  useRemovedFromChannelNotification<At, Ch, Co, Ev, Me, Re, Us>({
    onRemovedFromChannel,
    setChannels,
  });

  useUserPresence<At, Ch, Co, Ev, Me, Re, Us>({
    setChannels,
  });

  return (
    <List<At, Ch, Co, Ev, Me, Re, Us>
      {...props}
      channels={channels}
      error={status.error}
      forceUpdate={forceUpdate}
      hasNextPage={hasNextPage}
      loadingChannels={status.loadingChannels}
      loadingNextPage={status.loadingNextPage}
      loadNextPage={loadNextPage}
      refreshing={status.refreshing}
      refreshList={refreshList}
      reloadList={reloadList}
      setActiveChannel={onSelect}
      setFlatListRef={(
        ref: FlatList<Channel<At, Ch, Co, Ev, Me, Re, Us>> | null,
      ) => {
        listRef.current = ref;
        setFlatListRef && setFlatListRef(ref);
      }}
    />
  );
};

export default ChannelList;
