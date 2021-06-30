Please check the `ChannelsContextValue` in [ChannelsContext](https://github.com/GetStream/stream-chat-react-native/blob/master/src/contexts/channelsContext/ChannelsContext.md), for consumable values.
Provider for this context exists in `ChannelList` component. And so, any child component of ChannelList
can get access to context as following:

- Functional component

```tsx static
import { useChannelsContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { error, loadingChannels, refreshing } = useChannelsContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withChannelsContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.error);
    console.log(props.loadingChannels);
    console.log(props.refreshing);
  }

  // UI Logic
}

export withChannelsContext(SomeChildComponent);
```