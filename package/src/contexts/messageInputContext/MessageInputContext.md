Please check the `MessageInputContextValue` in [MessageInputContext](https://github.com/GetStream/stream-chat-react-native/blob/main/package/src/contexts/messageInputContext/MessageInputContext.tsx), for consumable values.
Provider for this context exists in `Channel` component. And so, any child component of `Channel`
can get access to context as following:

- Functional component

```tsx static
import { useMessageInputContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const {
    openAttachmentPicker,
    openCommandsPicker,
    openFilePicker,
    openMentionsPicker,
  } = useMessageInputContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withMessageInputContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.openAttachmentPicker);
    console.log(props.openCommandsPicker);
    console.log(props.openFilePicker);
  }

  // UI Logic
}
