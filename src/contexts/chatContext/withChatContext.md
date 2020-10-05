Any component can be made a consumer of [ChatContext](#chatcontext) by using function `withChatContext`.

**Example:**

```js static
import { Text, View } from 'react-native';

import { withChatContext } from './ChatContext';

const DemoComponentWithChatContext = withChatContext(DemoComponent);

const DemoComponent = (props) => (
  <View>
    <Text>ID of active channel: {props.channel.cid}</Text>
    <Text>Chat user is online: {props.isOnline}</Text>
  </View>
);
```
