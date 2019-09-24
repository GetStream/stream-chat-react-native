The channel context provides the following properties:

- `Message` UI component for message. Its same as prop `Message` of [Channel](#channel) component.
- `Attachment` UI component for attachment in message. Its same as prop `Attachment` of [Channel](#channel) component.
- `EmptyStateIndicator` UI component for empty state of Channel.
- `messages` {Array} List of immutable [message objects](https://getstream.io/chat/docs/#message_format)
- `online` {number} A count of the online users
- `typing` {ImmutableObject} A map of user ids of users who are typing vs corresponding typing [event object](https://getstream.io/chat/docs/#event_object) (where event type is `typing.start`).

  e.g.

  ```json
  {
    "user_id_1": typing_event_object_of_user_1,
    "user_id_2": typing_event_object_of_user_2
  }
  ```

- `watcher_count` {number} Count of watchers
- `watchers` {ImmutableObject} A map of user ids vs users who are currently watching the channel.

e.g.,

```json
{
  "thierry": {
    "id": "thierry",
    "role": "user",
    "created_at": "2019-04-03T14:42:47.087869Z",
    "updated_at": "2019-04-16T09:20:03.982283Z",
    "last_active": "2019-04-16T11:23:51.168113408+02:00",
    "online": true
  },
  "vishal": {
    "id": "vishal",
    "role": "user",
    "created_at": "2019-05-03T14:42:47.087869Z",
    "updated_at": "2019-05-16T09:20:03.982283Z",
    "last_active": "2019-06-16T11:23:51.168113408+02:00",
    "online": true
  }
}
```

- `members` {ImmutableObject} Members of this channel (members are permanent, watchers are users who are online right now)

e.g.,

```json
{
  "thierry": {
    "id": "thierry",
    "role": "user",
    "created_at": "2019-04-03T14:42:47.087869Z",
    "updated_at": "2019-04-16T09:20:03.982283Z",
    "last_active": "2019-04-16T11:23:51.168113408+02:00",
    "online": true
  },
  "vishal": {
    "id": "vishal",
    "role": "user",
    "created_at": "2019-05-03T14:42:47.087869Z",
    "updated_at": "2019-05-16T09:20:03.982283Z",
    "last_active": "2019-06-16T11:23:51.168113408+02:00",
    "online": false
  }
}
```

- `read`: the read state for each user
- `error` {boolean} Bool indicating if there was an issue loading the channel
- `loading` {boolean} if the channel is currently loading
- `loadingMore` {boolean} if the channel is loading pagination
- `hasMore` {boolean} if the channel has more messages to paginate through
- `threadMessages` {}
- `threadLoadingMore` {boolean} If the thread is currently loading more messages
- `threadHasMore` {boolean} If there are more messages available in current active thread, set to false when the end of pagination is reached.
- `eventHistory`

  These functions:

- **sendMessage** The function to send a message on channel.

  **Params**

  - `message`: A [message object](https://getstream.io/chat/docs/#message_format) of message to be sent.

- **updateMessage** The function to update a message on channel.

  **Params**

  - `updatedMessage`: Updated [message object](https://getstream.io/chat/docs/#message_format)

- **retrySendMessage** The function to resend a message, handled by the Channel component

  **Params**

  - `message`: A [message](https://getstream.io/chat/docs/#message_format) to be sent

- **setEditingState** This method gets called when user selects edit action on some message. On code level it just sets `editing` property in state to message being edited

  **Params**

  - `message`: Message which is being edited.

- **clearEditingState** Function to clear the editing state.

- **markRead** Helper function to mark current channel as read.

- **removeMessage** The function to remove a message from messagelist, handled by the Channel component

  **Params**

  - `message`: A [message](https://getstream.io/chat/docs/#message_format) to be removed

- **openThread** Function to execute when replies count button is clicked.

  **Params**

  - `message` Parent message of thread which needs to be opened
  - `event` DOM click event

- **loadMore** Function to load next page/batch of messages (used for pagination). Next batch of results will be available in `messages` object in channel context.
- **closeThread** Function to close the currently open thread. This function should be attached to close button on thread UI.
- **loadMoreThread** Function to load next page/batch of messages in a currently active/open thread ((used for pagination).

And the data exposed by the chat context:
