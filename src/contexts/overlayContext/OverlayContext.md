Please check the `OverlayContextValue` in [OverlayContext](), for consumable values.
Provider for this context exists in `OverlayProvider` component. And so, any child component of OverlayProvider
can get access to context as following:

- Functional component

```tsx static
import { useOverlayContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { openThread, threadMessages } = useOverlayContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withOverlayContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.openThread);
    console.log(props.threadMessages);
  }

  // UI Logic
}