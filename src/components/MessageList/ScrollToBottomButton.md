```js
import { View } from 'react-native';

import { ScrollToBottomButton } from './ScrollToBottomButton';

import { Chat } from '../Chat/Chat';
import { client } from '../docs/data';

<Chat client={client}>
  <View style={{ width: 90 }}>
    <ScrollToBottomButton showNotification={true} onPress={() => {}} />
  </View>
</Chat>
```
