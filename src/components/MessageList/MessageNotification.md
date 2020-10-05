```js
import { View } from 'react-native';

import { MessageNotification } from './MessageNotification';

import { Chat } from '../Chat/Chat';
import { client } from '../docs/data';

<Chat client={client}>
  <View style={{ width: 90 }}>
    <MessageNotification showNotification={true} onPress={() => {}} />
  </View>
</Chat>
```
