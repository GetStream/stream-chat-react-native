Simple default LoadingIndicator

```js
const { client } = require('./data');

<Chat client={client}>
    <LoadingIndicator />
</Chat>
```

Channel LoadingIndicator

```js
const { client } = require('./data');

<Chat client={client}>
    <LoadingIndicator listType='channel' />
</Chat>
```

Message LoadingIndicator

```js
const { client } = require('./data');

<Chat client={client}>
    <LoadingIndicator listType='message' />
</Chat>
```
