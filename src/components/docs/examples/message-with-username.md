# Message bubble with name of the sender

In gorup messaging, its important to show the name of the sender with message bubble - similar to
slack or whatsapp. In this example we are going to add name of the sender on top of message content.

I can foresee different types of designs for this:

## Sender's name on the very top of message bubble (above text container, attachments)

  In this case, we are going to override `MessageContent` component via prop to add
  the name of sender, right before MessageContent (which includes attachments and message text)
  For the sake of simplicity, I am going to disable reaction selector (using `ReactionList={null}`), since it will create conflict
  in design. Check the [example](reactions-at-bottom-of-message.md) for moving reactions at bottom of the bubble.

```js static

class MessageContentWithName extends React.PureComponent {
  render() {
    return (
      <View style={{flexDirection: 'column', padding: 5}}>
        <Text style={{fontWeight: 'bold'}}>{this.props.message.user.name}</Text>
        <MessageContent {...this.props} />
      </View>
    );
  }
}

const MessageWithSenderName = props => {
  return (
    <MessageSimple
      {...props}
      ReactionList={null}
      MessageContent={MessageContentWithName}
    />
  );
};
```

## Sender's name inside text bubble/container

In this case, you want to override the `MessageText` component.

```js static

const MessageTextWithName = props => {
  const markdownStyles = props.theme
    ? props.theme.message.content.markdown
    : {};

  return (
    <View style={{flexDirection: 'column', padding: 5}}>
      <Text style={{fontWeight: 'bold'}}>{props.message.user.name}</Text>
      {props.renderText(props.message, markdownStyles)}
    </View>
  );
};

const MessageWithSenderNameInTextContainer = props => {
  return <MessageSimple {...props} MessageText={MessageTextWithName} />;
};
```

_**TIP** you can also mix above two cases. If there is an attachment to message, then show the name on top of everything, and if there is no attachment, then show the name inside text container/bubble. You can
conditionally render sender's name both in MessageText and MessageContent based on - `message.attachments.length > 0`_

## Sender's name at bottom of the message

In this case, we can use `MessageFooter` UI component prop to add name of the sender.


```js static
const MessageWithSenderNameAtBottom = props => {
  return (
    <MessageSimple
      {...props}
      MessageFooter={props => <Text>{props.message.user.name}</Text>}
    />
  );
};
```