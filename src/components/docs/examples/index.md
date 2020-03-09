# Different use cases of message bubble/component

`MessageList` component accepts `Message` prop, where you can mention or provide custom message (UI) component.
You can use built-in component as it is, but every product requires its own functionality/behaviour and styles.
For this you can either build your own component or you can also use in-built components with some modifications.

Here I am going to build some custom components, which use in-built components underneath with some modifications to its props.
All the props accepted by MessageSimple component are mentioned here - https://getstream.github.io/stream-chat-react-native/#messagesimple

Then all you need to do is to pass this component to MessageList component:

e.g.,

```js
<Chat client={chatClient}>
  <Channel>
    <MessageList Message={MessageSimpleModified} />
    <MessageInput />
  </Channel>
</Chat>
```

[EXAMPLE 1 - Show alert box with confirm/cancel buttons when message is deleted.](alert-on-delete.md)

[EXAMPLE 2 - Message bubble with custom text styles/font](custom-text-style-font.md)

[EXAMPLE 3 - Custom/different style for received and sent messages](different-styles-for-sent-&-received-message.md)

[EXAMPLE 4 - Instagram style double-tap reaction](ig-style-double-tap.md)

[EXAMPLE 5 - Message with custom reactions](custom-reactions.md)

[EXAMPLE 6 - Message bubble with reactions at bottom of message](reactions-at-bottom-of-message.md)

[EXAMPLE 7 - Slack style - all the messages on left side ](slack-style-messages-on-left-side.md)

[EXAMPLE 8 - Message bubble with name of sender ](message-with-username.md)
