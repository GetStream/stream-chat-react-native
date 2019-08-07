```js
const data = require('./data');
const View = require('react-native').View;

<View
  style={{
    height: '500px',
    width: '350px',
    borderColor: 'silver',
    borderWidth: '5px',
    borderRadius: '20px',
  }}
>
  <Chat client={data.client}>
    <ChannelList channels={data.channels} />
  </Chat>
</View>;
```
