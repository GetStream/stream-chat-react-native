```js
import { View }  from 'react-native';

import { ChannelList } from './ChannelList';

import { Chat } from '../Chat/Chat';
import { channels, client } from '../docs/data';

<View
  style={{
    height: '500px',
  }}
>
  <Chat client={client}>
    <ChannelList channels={channels} />
  </Chat>
</View>;
```
