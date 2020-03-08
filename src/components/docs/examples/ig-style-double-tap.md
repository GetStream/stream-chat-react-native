# Instagram style double-tap reaction

This case has two aspects:

1. Handle double tap and send `love` reaction

  There is no built-in way of handling double-taps in react-native. So we will implement it on our own (thanks to this blog - https://medium.com/handlebar-labs/instagram-style-double-tap-with-react-native-49e757f68de)

2. Remove `Add Reaction` option from actionsheet, which is shown when message is long pressed.
   `MessageSimple` accepts a array prop - `messageActions`. You can use this prop to remove `Add Reaction` option from actionsheet.

```js
import { MessageSimple } from 'stream-chat-react-native';

const MessageSimpleIgReaction = (props) => {
  let lastTap = null;
  const handleDoubleTap = () => {
    const now = Date.now();
    if (lastTap && now - lastTap < 300) {
      props.handleReaction('love');
    } else {
      lastTap = now;
    }
  };

  return (
    <MessageSimple
      {...props}
      onPress={handleDoubleTap}
      messageActions={['edit', 'delete', 'reply']} // not including `reactions` here.
    />
  );
};
```