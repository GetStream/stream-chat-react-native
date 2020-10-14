Unread channel preview:

```js
import { View }  from 'react-native';

import { ChannelList } from './ChannelList';
import { ChannelListMessenger } from './ChannelListMessenger';

import { Chat } from '../Chat/Chat';
import { channels, client } from '../docs/data';

<View
  style={{
    height: '500px',
  }}
>
  <Chat client={client}>
    <ChannelList channels={channels} List={ChannelListMessenger} />
  </Chat>
</View>;
```
