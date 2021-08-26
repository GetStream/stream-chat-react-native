Please check the `UserFormatContextValue` in [UserFormatContextValue](https://github.com/GetStream/stream-chat-react-native/blob/master/src/contexts/formatContext/UserFormatContextValue.tsx), for consumable values.

- Functional component

```tsx static
import { useUserFormat } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const { formatImage, formatName } = useUserFormat();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withUserFormatContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.formatImage);
    console.log(props.formatName);
  }

  // UI Logic
}

export withUserFormatContext(SomeChildComponent);
```