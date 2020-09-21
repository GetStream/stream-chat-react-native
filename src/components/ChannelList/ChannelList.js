import React, { useContext, useRef, useState } from 'react';
import PropTypes from 'prop-types';

import ChannelListMessenger from './ChannelListMessenger';

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

import { ChatContext } from '../../context';

/**
 * This component fetches a list of channels, allowing you to select the channel you want to open.
 * The ChannelList doesn't provide any UI for the underlying React Native FlatList. UI is determined by the `List` component which is
 * provided to the ChannelList component as a prop. By default, the ChannelListMessenger component is used as the list UI.
 *
 * @example ../docs/ChannelList.md
 */
const DEFAULT_FILTERS = {};
const DEFAULT_OPTIONS = {};
const DEFAULT_SORT = {};

const ChannelList = (props) => {
  const {
    List = ChannelListMessenger,
    filters = DEFAULT_FILTERS,
    lockChannelOrder = false,
    onAddedToChannel,
    onChannelDeleted,
    onChannelHidden,
    onChannelTruncated,
    onChannelUpdated,
    onMessageNew,
    onRemovedFromChannel,
    onSelect,
    options = DEFAULT_OPTIONS,
    setFlatListRef,
    sort = DEFAULT_SORT,
  } = props;

  const { client } = useContext(ChatContext);
  const listRef = useRef(null);
  const [forceUpdate, setForceUpdate] = useState(0);

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
    <List
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
      setFlatListRef={(ref) => {
        listRef.current = ref;
        setFlatListRef && setFlatListRef(ref);
      }}
    />
  );
};

/* eslint-disable */
ChannelList.propTypes = {
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
  additionalFlatListProps: PropTypes.object,
  /**
   * Object containing channel query filters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available filter fields
   * */
  filters: PropTypes.object,
  /**
   * The React Native FlatList threshold to fetch more data
   * @see See loadMoreThreshold [doc](https://facebook.github.io/react-native/docs/flatlist#onendreachedthreshold)
   * */
  loadMoreThreshold: PropTypes.number,
  /**
   * If set to true, channels won't dynamically sort by most recent message, defaults to false
   */
  lockChannelOrder: PropTypes.bool,
  /**
   * Function that overrides default behavior when a user gets added to a channel
   *
   * @param {Event} event [Event Object](https://getstream.io/chat/docs/event_object) corresponding to `notification.added_to_channel` event
   * */
  onAddedToChannel: PropTypes.func,
  /**
   * Function that overrides default behavior when a channel gets deleted. In absence of this prop, the channel will be removed from the list.
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.deleted` event
   * */
  onChannelDeleted: PropTypes.func,
  /**
   * Function that overrides default behavior when a channel gets hidden. In absence of this prop, the channel will be removed from the list.
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.hidden` event
   * */
  onChannelHidden: PropTypes.func,
  /**
   * Function to customize behavior when a channel gets truncated
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.truncated` event
   * */
  onChannelTruncated: PropTypes.func,
  /**
   * Function that overrides default behavior when a channel gets updated
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `channel.updated` event
   * */
  onChannelUpdated: PropTypes.func,
  /**
   * Function that overrides default behavior when new message is received on channel not currently being watched
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.message_new` event
   * */
  onMessageNew: PropTypes.func,
  /**
   * Function that overrides default behavior when a user gets removed from a channel
   *
   * @param {Event} event [Event object](https://getstream.io/chat/docs/event_object) corresponding to `notification.removed_from_channel` event
   * */
  onRemovedFromChannel: PropTypes.func,
  /**
   * Function to set the currently active channel, acts as a bridge between ChannelList and Channel components
   *
   * @param channel A channel object
   * */
  onSelect: PropTypes.func,
  /**
   * Object containing channel query options
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available option fields
   * */
  options: PropTypes.object,
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
  setFlatListRef: PropTypes.func,
  /**
   * Object containing channel sort parameters
   * @see See [Channel query documentation](https://getstream.io/chat/docs/query_channels) for a list of available sorting fields
   * */
  sort: PropTypes.object,
  /**
   * Custom indicator to use when channel list is empty
   *
   * Default: [EmptyStateIndicator](https://getstream.github.io/stream-chat-react-native/#emptystateindicator)
   * */
  EmptyStateIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom loading indicator to display at bottom of the list, while loading further pages
   *
   * Default: [ChannelListFooterLoadingIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListFooterLoadingIndicator)
   */
  FooterLoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom indicator to display error at top of list, if loading/pagination error occurs
   *
   * Default: [ChannelListHeaderErrorIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderErrorIndicator)
   */
  HeaderErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom indicator to display network-down error at top of list, if there is connectivity issue
   *
   * Default: [ChannelListHeaderNetworkDownIndicator](https://getstream.github.io/stream-chat-react-native/#ChannelListHeaderNetworkDownIndicator)
   */
  HeaderNetworkDownIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom UI component to display the list of channels
   *
   * Default: [ChannelListMessenger](https://getstream.github.io/stream-chat-react-native/#channellistmessenger)
   */
  List: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
  /**
   * Custom indicator to use when there is error in fetching channels
   *
   * Default: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react-native/#loadingerrorindicator)
   * */
  LoadingErrorIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom loading indicator to use
   *
   * Default: [LoadingIndicator](https://getstream.github.io/stream-chat-react-native/#loadingindicator)
   * */
  LoadingIndicator: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.elementType,
  ]),
  /**
   * Custom UI component to display individual channel list items
   *
   * Default: [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react-native/#channelpreviewmessenger)
   * */
  Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.elementType]),
};
/* eslint-enable */

export default ChannelList;
