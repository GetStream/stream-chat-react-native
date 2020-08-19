The chat context exposes the following properties:

- **channel** {object} The currently active channel, set if using `setActiveChannel` from context
- **client** {object} The client connection and StreamChat instance
- **connectionRecovering** {boolean} Whether or not the websocket connection is recovering
- **isOnline** {boolean} Whether or not the user is active and online
- **logger** {function} Custom logging function
- **setActiveChannel** {function} Sets the currently active channel, used in the [ChannelList](#channellist) component to navigate between channels

  **Params**

  - `channel` The channel to be set as active