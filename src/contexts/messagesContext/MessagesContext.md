The messages context exposes the following properties:

- **Attachment** {component} UI component for message attachments, same as `Attachment` prop of [Channel](#channel) component
- **clearEditingState** {function} Clears the message editing state
- **editing** {boolean or object} When editing, set to the message being edited
- **editMessage** {function} Edits a message in the Channel state and updates the `messages` array

  **Params:**

  - **updatedMessage:** The updated message object
- **emojiData** {array} List of available emojis for message reactions
- **hasMore** {boolean} Whether or not the channel has more messages to paginate through
- **loadingMore** {boolean} Whether or not the channel is loading more messages
- **loadMoreEarlier** {function} Loads the next page of messages in the Channel state and updates the `messages` array
- **Message** {component} UI component for a message, same as `Message` prop of [Channel](#channel) component
- **messages** {Array} List of [message objects](https://getstream.io/chat/docs/#message_format) supplied to the MessageList component
- **removeMessage** {function} Removes a message from the Channel state and updates the `messages` array

  **Params:**

  - **message**: The [message](https://getstream.io/chat/docs/#message_format) to be removed
- **retrySendMessage** {function} Attempts to resend a message, on success it updates the `messages` array

  **Params:**

  - **message**: The [message](https://getstream.io/chat/docs/#message_format) to be sent
- **sendMessage** {function} Sends a message in a channel and updates the `messages` array

  **Params:**

  - **message:** The [message](https://getstream.io/chat/docs/#message_format) to be sent
- **setEditingState** {function} Sets the editing state for a message and saves the message to the `editing` value

  **Params:**

  - **message:** The [message](https://getstream.io/chat/docs/#message_format) to be edited
- **updateMessage** {function} Updates a message in the Channel state and updates the `messages` array

  **Params:**

  - **updatedMessage:** The [message](https://getstream.io/chat/docs/#message_format) to be updated












