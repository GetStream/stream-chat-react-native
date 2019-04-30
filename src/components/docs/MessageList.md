The MessageList component does exactly that, it renders a list of messages.

It keeps the following state:

- newMessagesNotification (true when there are new messages and you've scrolled up)
- editing (the id of the message you are editing)
- online (if you're online or not)

Here's an example of how to render a list of messages:

```js
const data = require('./data');

<Chat client={data.client}>
  <Channel channel={data.channel}>
    <MessageList />
  </Channel>
</Chat>;
```
