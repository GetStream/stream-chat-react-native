Any component can consume the [MessagesContext](#messagescontext) and receive its values through props by using the higher order component `withMessagesContext`.

**Example:**

```js static
import { Text, View } from 'react-native';

import { withMessagesContext } from './MessagesContext';

const DemoComponentWithMessagesContext = withMessagesContext(DemoComponent);

const DemoComponent = (props) => {
  const { loadingMore, messages } = props;

  return (
    <View>
      <Text>
        MessageList is currently loading more: {loadingMore}
      </Text>
      <Text>
        Number of messages in demo component: {messages.length}
      </Text>
    </View>
  );
};
```
