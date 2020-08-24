```js
const { channel, client } = require('./data');
<Chat client={client}>
    <Channel channel={channel}>
        <MessageInput />
    </Channel>
</Chat>
```