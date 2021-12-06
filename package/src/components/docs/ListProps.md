All props available in the [ChannelList](#channellist) component are passed along to the List component. Additionally, the following props are provided to the List component:

- `error` {boolean | Error} Error in channels query, if any
- `channels` {array} List of channel objects
- `forceUpdate` {number} Incremental number change to force update the FlatList
- `hasNextPage` {boolean} Whether or not the FlatList has another page to render
- `loadingChannels` {boolean} Initial channels query loading state, triggers the LoadingIndicator
- `loadingNextPage` {boolean} Whether or not additional channels are being loaded, triggers the FooterLoadingIndicator
- `loadNextPage` {function} Loads the next page of `channels`
- `refreshing` {boolean} List of channels is being refreshed or re-queried (in case of reconnection)
- `refreshList` {function} Refresh the channel list without reloading existing channels
- `reloadList` {function} Removes all the existing channels from UI and loads fresh channels
- `setActiveChannel` {function} Sets the currently active channel
- `setFlatListRef` {function} Gains access to the inner FlatList ref
