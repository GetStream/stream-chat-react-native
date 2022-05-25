Please check the `ChatContextValue` in [ChatContext](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/chatContext/ChatContext.tsx), for consumable values.
Provider for this context exists in `Chat` component. And so, any child component of Chat
can get access to context as following:

- Functional component

```tsx static
import { useChatContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { client, isOnline } = useChatContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withChatContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.client);
    console.log(props.isOnline);
  }

  // UI Logic
}

export withChatContext(SomeChildComponent);
```
