Any component can be made a consumer of [ChatContext](#chatcontext) by using function `withChatContext`.

**Example:**

```js static
const DemoComponentWithChatContext = withChatContext(DemoComponent);

class DemoComponent extends React.Component {
  render() {
    return (
      <View>
        <Text>ID of active channel: {this.props.channel.cid}</Text>
        <Text>Chat user is online: {this.props.isOnline}</Text>
      </View>
    );
  }
}
```
