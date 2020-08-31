Any component can consume the [ThreadContext](#threadcontext) and receive its values through props by using the higher order component `withThreadContext`.

**Example:**

```js static
const DemoComponentWithThreadContext = withThreadContext(DemoComponent);

class DemoComponent extends React.Component {
  const { threadMessages } = this.props;
  render() {
    return (
      <View>
        <Text>
          Number of thread messages in demo component: {threadMessages.length}
        </Text>
      </View>
    );
  }
}
```
