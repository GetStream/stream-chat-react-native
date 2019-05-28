The channel component provides the channel context to the underlying components.

The channel context provides the following properties:

- messages: the list of immutable messages
- online: a count of the online users
- typing: who is currently typing
- watchers: who is currently online
- members: members of this channel (members are permanent, watchers are users who are online right now)
- read: the read state for each user
- error: bool indicating if there was an issue loading the channel
- loading: if the channel is currently loading
- loadingMore: if the channel is loading pagination
- hasMore: if the channel has more messages to paginate through

These functions:

- updateMessage
- removeMessage
- sendMessage
- retrySendMessage
- resetNotification
- loadMore

And the data exposed by the chat context:

- client (the client connection)
- channels (the list of channels)
- setActiveChannel (a function to set the currently active channel)
- channel (the currently active channel)

```js
const data = require('./data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <MessageList />
  </Channel>
</Chat>;
```
