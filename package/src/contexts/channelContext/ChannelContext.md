Please check the `ChannelContextValue` in [ChannelContext](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/channelContext/ChannelContext.md), for consumable values.
Provider for this context exists in `Channel` component. And so, any child component of Channel
can get access to context as following:

- Functional component

```tsx static
import { useChannelContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { loading, reloadChannel } = useChannelContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withChannelContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.loading);
    console.log(props.reloadChannel);
  }

  // UI Logic
}

export withChannelContext(SomeChildComponent);
```
