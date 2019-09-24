The Message component is the high level component that deals with all the message logic.
It doesn't implement any rendering, but delegates that to the Message prop.

The Message component provides the following functions to the rendered component:

- **isMyMessage** returns true if message belongs to current user, else false

  **Params**

  - `message`

- **isAdmin** returns true if current user has admin role.
- **canEditMessage** returns true if current user has permission to edit message.
- **canDeleteMessage** returns true if current user has permission to edit message.
- **handleFlag** Handler to flag a message
- **handleMute** Handler to mute a user of message
- **handleEdit** Handler to edit a message This message simply sets current message as value of `editing` property of channel context. `editing` prop is then used by MessageInput component to switch to edit mode.
- **handleDelete** Handler to delete a message
- **handleReaction** Handler to add/remove reaction on message
- **handleAction** Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
- **handleRetry** Handler to resend the message, in case of failure.
- **openThread** Handler to open the thread on current message.
