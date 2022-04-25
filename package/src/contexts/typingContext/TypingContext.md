Please check the `TypingContextValue` in [TypingContext](https://github.com/GetStream/stream-chat-react-native/blob/master/package/src/contexts/TypingContext/TypingContext.tsx), for consumable values.
Provider for this context exists in `Channel` component. And so, any child component of Channel
can get access to context as following:

- Functional component

```tsx static
import { useTypingContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { typing } = useTypingContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withTypingContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.typing);
  }

  // UI Logic
}
