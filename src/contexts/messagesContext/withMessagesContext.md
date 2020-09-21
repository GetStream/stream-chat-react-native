Any component can consume the [MessagesContext](#messagescontext) and receive its values through props by using the higher order component `withMessagesContext`.

**Example:**

```js static
const DemoComponentWithMessagesContext = withMessagesContext(DemoComponent);

class DemoComponent extends React.Component {
  const { loadingMore, messages } = this.props;
  render() {
    return (
      <View>
        <Text>
          MessageList is currently loading more: {loadingMore}
        </Text>
        <Text>
          Number of messages in demo component: {messages.length}
        </Text>
      </View>
    );
  }
}
```
