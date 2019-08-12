The channel context provides the following properties:

- **client** (the client connection)
- **channels** {array} The list of channels
- **setActiveChannel** A function to set the currently active channel. This is used in [ChannelList](#channellist) component to navigate between channels.

  **Params**

  - `channel` Channel that needs to set to as active channel.

- **channel** The currently active channel
