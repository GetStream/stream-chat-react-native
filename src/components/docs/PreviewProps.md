All props available to the [ChannelPreview](#channelpreview) component are also passed to the ChannelPreviewMessenger UI component. Additionally, the following channel specific properties are available:

- `formatLatestMessageDate` {function} Formatter function for date of the latest message
- `lastMessage` {object} Latest received message on the channel
- `latestMessageLength` {number} Length at which latest message should be truncated
- `latestMessagePreview` {object} Formatted message object with preview display information
- `unread` {number} Number of unread messages on the channel
