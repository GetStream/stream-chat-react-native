import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import { ChatContext } from '../../context';

import ChannelListMessengerDefault from './ChannelListMessenger';

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

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open.
 * This components doesn't provide any UI for the list. UI is provided by component `List` which should be
 * provided to this component as prop. By default ChannelListMessenger is used a list UI.
 *
 * @example ../docs/ChannelList.md
 */
const ChannelList = (props) => {
  const {
    ChannelListMessenger = ChannelListMessengerDefault,
    filters = {},
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

  const { client } = useContext(ChatContext);
  const [forceUpdate, setForceUpdate] = useState(0);
  const listRef = useRef(null);

  const {
    channels,
    hasNextPage,
    loadNextPage,
    refreshList,
    reloadList,
    setChannels,
    status,
  } = usePaginatedChannels({
    client,
    filters,
    options,
    sort,
  });

  // Setup event listeners
  useAddedToChannelNotification({ onAddedToChannel, setChannels });
  useChannelDeleted({ onChannelDeleted, setChannels });
  useChannelHidden({ onChannelHidden, setChannels });
  useChannelTruncated({ onChannelTruncated, setChannels, setForceUpdate });
  useChannelUpdated({ onChannelUpdated, setChannels });
  useConnectionRecovered({ setForceUpdate });
  useNewMessage({ lockChannelOrder, setChannels });
  useNewMessageNotification({ onMessageNew, setChannels });
  useRemovedFromChannelNotification({ onRemovedFromChannel, setChannels });
  useUserPresence({ setChannels });

  return (
    <ChannelListMessenger
      {...props}
      channels={channels}
      error={status.error}
      forceUpdate={forceUpdate}
      hasNextPage={hasNextPage}
      loadingChannels={status.loadingChannels}
      loadNextPage={loadNextPage}
      loadingNextPage={status.loadingNextPage}
      refreshing={status.refreshing}
      refreshList={refreshList}
      reloadList={reloadList}
      setActiveChannel={onSelect}
      setFlatListRef={(ref) => {
        listRef.current = ref; // TODO: see if this is correct!
        setFlatListRef && setFlatListRef(ref);
      }}
    />
  );
};

ChannelList.propTypes = {
  /** The Preview to use, defaults to [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger) */
  ChannelPreviewMessenger: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),

  /** The loading indicator to use */
  LoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** The indicator to use when there is error in fetching channels */
  LoadingErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /** The indicator to use when channel list is empty */
  EmptyStateIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * The indicator to display network-down error at top of list, if there is connectivity issue
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
   */
  HeaderNetworkDownIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * The indicator to display error at top of list, if there was an error loading some page/channels after the first page.
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
   */
  HeaderErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Loading indicator to display at bottom of the list, while loading further pages.
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
   */
  FooterLoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  List: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  onSelect: PropTypes.func,
  /**
   * Function that overrides default behaviour when new message is received on channel that is not being watched
   *
   * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.message_new` event
   * */
  onMessageNew: PropTypes.func,
  /**
   * Function that overrides default behaviour when users gets added to a channel
   *
   * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.added_to_channel` event
   * */
  onAddedToChannel: PropTypes.func,
  /**
   * Function that overrides default behaviour when users gets removed from a channel
   *
   * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.removed_from_channel` event
   * */
  onRemovedFromChannel: PropTypes.func,
  /**
   * Function that overrides default behaviour when channel gets updated
   *
   * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.updated` event
   * */
  onChannelUpdated: PropTypes.func,
  /**
   * Function to customize behaviour when channel gets truncated
   *
   * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.truncated` event
   * */
  onChannelTruncated: PropTypes.func,
  /**
   * Function that overrides default behaviour when channel gets deleted. In absence of this prop, channel will be removed from the list.
   *
   * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.deleted` event
   * */
  onChannelDeleted: PropTypes.func,
  /**
   * Function that overrides default behaviour when channel gets hidden. In absence of this prop, channel will be removed from the list.
   *
   * @param {Event} event       [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.hidden` event
   * */
  onChannelHidden: PropTypes.func,
  /**
   * Object containing query filters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available fields for filter.
   * */
  filters: PropTypes.object,
  /**
   * Object containing query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available fields for options.
   * */
  options: PropTypes.object,
  /**
   * Object containing sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available fields for sort.
   * */
  sort: PropTypes.object,
  /** For flatlist  */
  loadMoreThreshold: PropTypes.number,
  /** Client object. Available from [Chat context](#chatcontext) */
  client: PropTypes.object,
  /**
   * Function to set change active channel. This function acts as bridge between channel list and currently active channel component.
   *
   * @param channel A Channel object
   */
  setActiveChannel: PropTypes.func,
  /**
   * If true, channels won't be dynamically sorted by most recent message.
   */
  lockChannelOrder: PropTypes.bool,
  /**
   * Besides existing (default) UX behaviour of underlying flatlist of ChannelList component, if you want
   * to attach some additional props to underlying flatlist, you can add it to following prop.
   *
   * You can find list of all the available FlatList props here - https://facebook.github.io/react-native/docs/flatlist#props
   *
   * **NOTE** Don't use `additionalFlatListProps` to get access to ref of flatlist. Use `setFlatListRef` instead.
   *
   * e.g.
   * ```
   * <ChannelList
   *  filters={filters}
   *  sort={sort}
   *  additionalFlatListProps={{ bounces: true }} />
   * ```
   */
  additionalFlatListProps: PropTypes.object,
  /**
   * Use `setFlatListRef` to get access to ref to inner FlatList.
   *
   * e.g.
   * ```
   * <ChannelList
   *  setFlatListRef={(ref) => {
   *    // Use ref for your own good
   *  }}
   * ```
   */
  setFlatListRef: PropTypes.func,
};

export default ChannelList;
