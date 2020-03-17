Any component can be made a consumer of [ChatContext](#chatcontext) by using function `withChatContext`.

e.g.,

```js static
const DemoComponentWithChatContext = withChatContext(DemoComponent);

class DemoComponent extends React.Component {
  render() {
    return (
      <div>
        This is demo component with channel context Number of channels loaded::{' '}
        {this.props.channels.length}
        Id of active channel: {this.props.channel.cid}
      </div>
    );
  }
}
```
