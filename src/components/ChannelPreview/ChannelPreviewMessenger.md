Unread channel preview:

```js
const data = require('./data');

<ChannelPreviewMessenger
  {...data.channelContext}
  latestMessage={data.message}
  unread={10}
/>;
```

Read channel preview:

```js
const data = require('./data');

<ChannelPreviewMessenger
  {...data.channelContext}
  latestMessage={data.message}
  unread={0}
/>;
```
