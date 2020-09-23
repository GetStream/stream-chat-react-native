Unread channel preview:

```js
const data = require('../docs/data.js');
const View = require('react-native').View;

<View
  style={{
    height: '500px',
  }}
>
  <Chat client={data.client}>
    <ChannelList channels={data.channels} List={ChannelListMessenger} />
  </Chat>
</View>;
```
