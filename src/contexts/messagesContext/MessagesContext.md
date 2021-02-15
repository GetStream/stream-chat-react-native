Please check the `MessagesContextValue` in [MessagesContext](), for consumable values.
Provider for this context exists in `Channel` component. And so, any child component of Channel
can get access to context as following:

- Functional component

```tsx static
import { useMessagesContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { handleDelete, handleRetry } = useMessagesContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withMessagesContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.handleDelete);
    console.log(props.handleRetry);
    console.log(props.refreshing);
  }

  // UI Logic
}
