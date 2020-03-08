# Custom/different style for received and sent messages

**NOTE:** Please read [Message bubble with custom text styles/font](custom-text-style-font.md) before proceeding.

Global style will apply to both received and sent message. So in this case, we will provide styles to MessageSimple component separately, depending on whether the message belongs to current user or not.

Here I am aiming for following styles:

- If message belongs to me

  - White background
  - Black colored text

- If message doesn't belong to me
  - Blue background
  - white colored text

```js
const MessageSimpleStyled = (props) => {
  const { isMyMessage, message } = props;

  const sentMessageStyles = {
    'message.content.markdown': {
      text: {
        color: 'black',
      },
    },
    'message.content.textContainer':
      'background-color: white; border-color: black; border-width: 1',
  };

  const receivedMessageStyles = {
    'message.content.markdown': {
      text: {
        color: 'white',
      },
    },
    'message.content.textContainer': 'background-color: #9999FF;',
  };

  if (isMyMessage(message)) {
    return <MessageSimple {...props} style={sentMessageStyles} />;
  } else {
    return <MessageSimple {...props} style={receivedMessageStyles} />;
  }
};
```
