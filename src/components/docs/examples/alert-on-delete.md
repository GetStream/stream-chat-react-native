# Show alert box with confirm/cancel buttons when message is deleted.

`MessageSimple` accepts a prop function - `handleDelete`. Default value (function) is provided by HOC Message component - https://github.com/GetStream/stream-chat-react-native/blob/master/src/components/Message.js#L150

So in this example we will override `handleDelete` prop:

```js
import { Alert } from 'react-native';
import { MessageSimple } from 'stream-chat-react-native';

const MessageSimpleModified = (props) => {
  const onDelete = () => {
    // Custom behaviour
    // If you face the issue of Alert disappearing instantly, then refer to this answer:
    // https://stackoverflow.com/a/40041564/1460210
    Alert.alert(
      'Deleting message',
      'Are you sure you want to delete the message?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log(`Message won't be deleted`),
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            // If user says ok, then go ahead with deleting the message.
            props.handleDelete();
          },
        },
      ],
      { cancelable: false },
    );
    // Continue with original handler.
  };

  return <MessageSimple {...props} handleDelete={onDelete} />;
};
```