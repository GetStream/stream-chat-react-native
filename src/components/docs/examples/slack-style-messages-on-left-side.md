# All the messages on left side - slack style

By default, received messages are shown on left side of MessageList and sent messages are shown on right side of the message list. 

`MessageSimple` component accepts the boolean prop - `forceAlign`, which can be used to override the alignment of message bubble relative to MessageList component.
Its value could be either `left` or `right`.

```js

const MessageSimpleLeftAligned = props => {
  return <MessageSimple {...props} forceAlign="left" />;
};

```