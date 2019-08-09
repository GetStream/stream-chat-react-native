Following props are accepted by List component

All the props available in [ChannelList](#channellist) component are passed along to List component.

Additionally, following state properties are also provided as props to List component:

- `error` {boolean} Error in querying channels
- `channels` {array} List of channel objects.
- `channelIds` {array} List of channel ids.
- `loadingChannels` {boolean} Channels are being loaded via query
- `refreshing` {boolean} List of channels is being refreshed or requeries (in case of reconnection)
- `offset` {number} Current offset of list of channels (for pagination)
- `loadNextPage` {function} Handler to load next page of channels.
