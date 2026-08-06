import React, { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';
import type { FlatList } from 'react-native-gesture-handler';

import {
  Channel,
  ChannelFilters,
  ChannelManager,
  ChannelManagerEventHandlerContext,
  ChannelOptions,
  ChannelSort,
  EventHandlerPipelineHandler,
  EventType,
} from 'stream-chat';

import { ChannelListView } from './ChannelListView';
import { useCreateChannelsContext } from './hooks/useCreateChannelsContext';
import {
  ChannelListQueryChannelsOverride,
  usePaginatedChannels,
} from './hooks/usePaginatedChannels';

import {
  ChannelsContextValue,
  ChannelsProvider,
} from '../../contexts/channelsContext/ChannelsContext';
import { useChatContext } from '../../contexts/chatContext/ChatContext';
import { useComponentsContext } from '../../contexts/componentsContext/ComponentsContext';
import { SwipeRegistryProvider } from '../../contexts/swipeableContext/SwipeRegistryContext';
import { useLazyRef } from '../../hooks/useLazyRef';
import { generateRandomId } from '../../utils/utils';
import { NotificationTargetProvider } from '../Notifications/NotificationTargetContext';

/**
 * A `ChannelList` event handler. It is registered on the shared `ChannelManager`'s
 * `EventHandlerPipeline` for its event type and REPLACES the SDK's default handler for that event
 * (matching the previous "override" semantics). It receives the routed `event` plus a `ctx` exposing
 * the `channelManager` — from which the relevant `ChannelPaginator`(s) can be read/mutated
 * (`ingestItem`, `removeItem`, `setItems`, `boost`, …). Returning `{ action: 'stop' }` cancels the rest
 * of the pipeline for that event.
 *
 * NOTE (breaking change vs v9): these handlers previously received `(setChannels, event, options?)`.
 * The `setChannels` dispatcher no longer exists — list mutation now goes through the paginator obtained
 * from `ctx.channelManager`.
 */
export type ChannelListEventHandler =
  EventHandlerPipelineHandler<ChannelManagerEventHandlerContext>;

export type ChannelListProps = Partial<
  Pick<
    ChannelsContextValue,
    | 'additionalFlatListProps'
    | 'setFlatListRef'
    | 'onSelect'
    | 'getChannelActionItems'
    | 'swipeActionsEnabled'
    | 'loadMoreThreshold'
    | 'maxUnreadCount'
    | 'numberOfSkeletons'
    | 'mutedStatusPosition'
    | 'pinnedStatusPosition'
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
   * If set to true, channels won't dynamically sort by most recent message, defaults to false
   */
  lockChannelOrder?: boolean;
  /**
   * Overrides the default handler for the `notification.added_to_channel` event on the shared
   * `ChannelManager`. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onAddedToChannel?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `channel.deleted` event. In its absence the channel is
   * removed from the list. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onChannelDeleted?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `channel.hidden` event. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onChannelHidden?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `member.updated` event. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   */
  onChannelMemberUpdated?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `channel.truncated` event. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onChannelTruncated?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `channel.updated` event. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onChannelUpdated?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `channel.visible` event. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onChannelVisible?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `message.new` event. See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onNewMessage?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `notification.message_new` event (received for a channel that
   * is not being watched). See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onNewMessageNotification?: ChannelListEventHandler;
  /**
   * Overrides the default handler for the `notification.removed_from_channel` event.
   * See {@link ChannelListEventHandler}.
   *
   * @overrideType Function
   * */
  onRemovedFromChannel?: ChannelListEventHandler;
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

  /**
   * A custom request implementation for this list's `ChannelPaginator` (its `doRequest`). Use it to
   * query a specific set of channels while still paginating over them. Call `client.queryChannels(...)`
   * inside so client state stays in sync, and return `{ items }`.
   *
   * NOTE (breaking change vs v9): this replaces the previous `queryChannelsOverride` typed as the
   * removed `QueryChannelsRequestType` (which returned `Channel[]`).
   */
  queryChannelsOverride?: ChannelListQueryChannelsOverride;
  notificationHostId?: string;
};

const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT: ChannelSort = [];

/** The event types whose default handlers a `ChannelList` prop can override, mapped to the prop. */
const OVERRIDE_HANDLER_ID_PREFIX = 'stream-chat-react-native:channel-list';

/**
 * This component fetches a list of channels, allowing you to select the channel you want to open.
 * The ChannelList renders a ChannelListView which provides the UI for the underlying React Native FlatList.
 *
 * @example ./ChannelList.md
 */
export const ChannelList = (props: ChannelListProps) => {
  const {
    additionalFlatListProps = {},
    channelRenderFilterFn,
    filters = DEFAULT_FILTERS,
    // https://stackoverflow.com/a/60666252/10826415
    loadMoreThreshold = 0.1,
    lockChannelOrder = false,
    maxUnreadCount = 255,
    numberOfSkeletons = 8,
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
    getChannelActionItems,
    setFlatListRef,
    sort = DEFAULT_SORT,
    queryChannelsOverride,
    notificationHostId: notificationHostIdProp,
    mutedStatusPosition = 'inlineTitle',
    pinnedStatusPosition = 'inlineTitle',
    swipeActionsEnabled = true,
  } = props;

  const [forceUpdate] = useState(0);
  const fallbackNotificationHostIdRef = useLazyRef(() => `channel-list:${generateRandomId()}`);
  const notificationHostId = notificationHostIdProp ?? fallbackNotificationHostIdRef.current;
  const { channelManager, enableOfflineSupport } = useChatContext();
  const { NotificationList } = useComponentsContext();

  /**
   * Register this list's event-handler overrides on the shared `ChannelManager`. Each provided prop
   * replaces the SDK default handler for that event type; on unmount / prop change we restore the
   * default. Handlers are manager-global: with multiple mounted `<ChannelList>`s the last-registered
   * override for a given event wins (single-list is the common case).
   */
  useEffect(() => {
    const overrides: Array<[EventType, ChannelListEventHandler | undefined]> = [
      ['channel.deleted', onChannelDeleted],
      ['channel.hidden', onChannelHidden],
      ['channel.truncated', onChannelTruncated],
      ['channel.updated', onChannelUpdated],
      ['channel.visible', onChannelVisible],
      ['member.updated', onChannelMemberUpdated],
      ['message.new', onNewMessage],
      ['notification.added_to_channel', onAddedToChannel],
      ['notification.message_new', onNewMessageNotification],
      ['notification.removed_from_channel', onRemovedFromChannel],
    ];

    const overriddenEventTypes = overrides
      .filter(([, handle]) => typeof handle === 'function')
      .map(([eventType, handle]) => {
        channelManager.setEventHandlers({
          eventType,
          handlers: [{ handle: handle!, id: `${OVERRIDE_HANDLER_ID_PREFIX}:${eventType}` }],
        });
        return eventType;
      });

    if (overriddenEventTypes.length === 0) {
      return;
    }

    const defaultHandlers = ChannelManager.getDefaultHandlers();
    return () => {
      overriddenEventTypes.forEach((eventType) => {
        channelManager.setEventHandlers({
          eventType,
          handlers: defaultHandlers[eventType] ?? [],
        });
      });
    };
  }, [
    channelManager,
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
  ]);

  // Ref-counted on the shared manager: subscriptions live only while at least one ChannelList is mounted.
  useEffect(() => channelManager.registerSubscriptions(), [channelManager]);

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
    lockChannelOrder,
    options,
    queryChannelsOverride,
    sort,
  });

  const channelsContext = useCreateChannelsContext({
    additionalFlatListProps,
    channelListInitialized,
    channels: channelRenderFilterFn ? channelRenderFilterFn(channels ?? []) : (channels ?? null),
    error,
    forceUpdate,
    hasNextPage,
    loadingChannels,
    loadingNextPage,
    loadMoreThreshold,
    loadNextPage,
    maxUnreadCount,
    numberOfSkeletons,
    onSelect,
    getChannelActionItems,
    swipeActionsEnabled,
    refreshing,
    refreshList,
    reloadList,
    setFlatListRef: (ref: FlatList<Channel> | null) => {
      if (setFlatListRef) {
        setFlatListRef(ref);
      }
    },
    mutedStatusPosition,
    pinnedStatusPosition,
  });

  return (
    <NotificationTargetProvider hostId={notificationHostId} panel='channel-list'>
      <ChannelsProvider value={channelsContext}>
        <SwipeRegistryProvider>
          <View style={styles.container}>
            <ChannelListView />
            <NotificationList />
          </View>
        </SwipeRegistryProvider>
      </ChannelsProvider>
    </NotificationTargetProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});
