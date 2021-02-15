Please check the `ThreadContexttValue` in [ThreadContextt](), for consumable values.
Provider for this context exists in `Channel` component. And so, any child component of Channel
can get access to context as following:

- Functional component

```tsx static
import { useThreadContextt } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { openThread, threadMessages } = useThreadContextt();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withThreadContextt } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.openThread);
    console.log(props.threadMessages);
  }

  // UI Logic
}
