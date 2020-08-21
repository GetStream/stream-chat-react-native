```js
const data = require('./data');
<Chat client={data.client}>
    <Channel channel={data.channel}>
        <MessageInput {...data.channelContext} {...data.suggestionsContext} {...data.translationContext} />
    </Channel>
</Chat>
```