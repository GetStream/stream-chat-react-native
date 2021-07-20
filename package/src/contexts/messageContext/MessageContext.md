Please check the `MessageContextValue` in [MessageContext](https://github.com/GetStream/stream-chat-react-native/blob/master/src/contexts/messageContext/MessageContext.tsx), for consumable values.
Provider for this context exists in `Message` component. And so, any child component of `Message`
can get access to context as following:

- Functional component

```tsx static
import { useMessageContext } from 'stream-chat-react-native';

const SomeChildComponent = () => {
  const {
    handleDeleteMessage,
    handleEditMessage,
    handleQuotedReplyMessage,
    handleResendMessage,
    handleToggleBanUser,
    handleToggleMuteUser,
    handleToggleReaction,
  } = useMessageContext();

  return (
    <View />
  )
}
```

- Class component

```tsx static
import React from 'react';
import { withMessageContext } from 'stream-chat-react-native';

class SomeChildComponent extends React.Component {
  constructor(props) {
    super(props);

    console.log(props.handleDeleteMessage);
    console.log(props.handleEditMessage);
    console.log(props.handleToggleReaction);
  }

  // UI Logic
}
