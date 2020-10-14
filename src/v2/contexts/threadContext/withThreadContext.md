Any component can consume the [ThreadContext](#threadcontext) and receive its values through props by using the higher order component `withThreadContext`.

**Example:**

```js static
import { Text, View } from 'react-native';

import { withThreadContext } from './TheadContext';

const DemoComponentWithThreadContext = withThreadContext(DemoComponent);

const DemoComponent = (props) => {
  const { threadMessages } = props;
  return (
    <View>
      <Text>
        Number of thread messages in demo component: {threadMessages.length}
      </Text>
    </View>
  );
};
```
