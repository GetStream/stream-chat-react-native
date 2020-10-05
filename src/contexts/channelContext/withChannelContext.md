Any component can be made a consumer of [ChatContext](#chatcontext) by using function `withChannelContext`.

e.g.,

```js static
import { Text, View } from 'react-native';

import { withChannelContext } from './ChannelContext';

const DemoComponentWithChannelContext = withChannelContext(DemoComponent);

const DemoComponent = (props) => (
  <View>
    <Text>
      This is a demo component with channel context
      Number of channel members: {props.members.length}
    </Text>
  </View>
);
```
