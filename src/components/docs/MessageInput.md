```js
const data = require('./data');
<Chat client={data.client}>
    <MessageInput {...data.channelContext} {...data.suggestionsContext} {...data.translationContext} />
</Chat>
```
