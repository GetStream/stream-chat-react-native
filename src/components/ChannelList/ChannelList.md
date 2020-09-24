```js
const data = require('../docs/data');
const View = require('react-native').View;

<View
  style={{
    height: '500px',
  }}
>
  <Chat client={data.client}>
    <ChannelList channels={data.channels} />
  </Chat>
</View>;
```
